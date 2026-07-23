import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const publicPaths = ['/auth', '/auth/callback', '/_not-found']
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // If not authenticated and trying to access protected route → redirect to auth
  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Red Team S9: Block accounts that are pending_deletion.
  // We use a single-row RPC-less query through supabase-js; if the profile
  // has deleted_at set, force sign-out and bounce to /auth.
  if (user && !isPublicPath && request.nextUrl.pathname !== '/') {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('deleted_at, is_admin')
        .eq('id', user.id)
        .single()

      if (profile?.deleted_at) {
        // Clear auth cookies and redirect.
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('reason', 'account_pending_deletion')
        const redirectResponse = NextResponse.redirect(url)
        // Remove the auth cookies so the session is invalidated client-side.
        for (const cookieName of ['sb-access-token', 'sb-refresh-token']) {
          redirectResponse.cookies.delete(cookieName)
        }
        return redirectResponse
      }

      // Red Team S8: /admin/* is protected by profiles.is_admin.
      if (request.nextUrl.pathname.startsWith('/admin') && !profile?.is_admin) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (err) {
      // If the profile lookup fails, do not block — fail open on middleware
      // and rely on the route's own RLS to deny access.
      console.error('[middleware] profile lookup failed:', err)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}