import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PocketCoach EU — Micro-habits. Macro results.",
  description:
    "5 minutes a day to build lasting habits. Gamified, private, European-made.",
  keywords: ["habits", "productivity", "gamification", "streak", "micro-habits"],
  manifest: "/manifest.json",
  themeColor: "#22c55e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PocketCoach",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <QueryProvider>
          <main className="max-w-md mx-auto px-4 py-6">{children}</main>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
