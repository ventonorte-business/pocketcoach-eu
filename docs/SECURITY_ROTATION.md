# Service Role Key Rotation

## Objetivo

Rotacionar a `service_role key` do Supabase a cada 90 dias para reduzir o impacto de vazamento de credenciais privilegiadas.

## Frequência

- Periodicidade: a cada 90 dias.
- Também rotacionar imediatamente se houver suspeita de vazamento, log exposto ou commit acidental.

## Procedimento

1. Abra o Supabase Dashboard do projeto.
2. Vá em `Settings` → `API`.
3. Localize a chave `service_role`.
4. Clique em `Regenerate service_role key`.
5. Copie a nova chave.
6. Atualize o ambiente local:
   - `.env.local`
   - variável: `SUPABASE_SERVICE_ROLE_KEY`
7. Atualize as variáveis na Vercel:
   - Project → `Settings` → `Environment Variables`
   - atualize `SUPABASE_SERVICE_ROLE_KEY`
   - aplique em Production, Preview e Development, se usados.
8. Faça redeploy da aplicação na Vercel.
9. Valide rotas que usam `service_role`:
   - `/api/webhooks/lemonsqueezy`
   - `/api/cron/daily-reset`
   - `/api/cron/purge-soft-deleted`
   - `/api/account/delete`
   - `/admin/reconcile`
10. Remova qualquer cópia temporária da chave antiga.

## Checklist pós-rotação

- `npm run build` passa localmente.
- Webhook Lemon Squeezy processa evento real ou evento de teste.
- Cron `daily-reset` retorna 200.
- Cron `purge-soft-deleted` retorna 200.
- Painel `/admin/reconcile` abre para usuário com `profiles.is_admin = true`.
- Usuário comum não acessa `/admin/reconcile`.

## Observações

- Nunca commitar `.env.local` ou chaves em arquivos do repositório.
- A `service_role key` ignora RLS. Tratar como segredo de produção crítico.
- Se a chave antiga foi exposta, revisar logs e rotacionar também webhooks relacionados.