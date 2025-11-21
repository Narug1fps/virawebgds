import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Providers } from "./providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ViraWeb - Gestor de Clientes",
  description: "Sistema completo de gerenciamento de clientes, agendamentos e profissionais",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <link rel="shortcut icon" href="/viraweb6.ico" type="image/x-icon" />
      <body className={`font-sans antialiased selection:bg-primary selection:text-white`}>
        {/*
          Inline script to set the initial theme class on the <html> element
          before React hydrates. This prevents a hydration mismatch where the
          client mutates document.documentElement (next-themes) and the server
          render didn't include the class.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Start light by default. Only enable dark if the user explicitly
              // selected it previously (localStorage 'theme' === 'dark').
              var theme = localStorage.getItem('theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              }
            } catch (e) {
              // silent
            }
          })();
        ` }} />

        <Providers>
          {children}
        </Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
