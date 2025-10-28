import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeSettings from "@/components/dashboard/theme-settings"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ViraWeb - Gerenciamento de Agendamentos",
  description: "Sistema completo de gerenciamento de agendamentos para empresas, clínicas e profissionais",
  generator: "v0.app",
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
        <ThemeProvider>
          {children}
          <ThemeSettings />
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
