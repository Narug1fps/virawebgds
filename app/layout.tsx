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
  title: "ViraWeb — Gestor de Clientes e Agendamentos",
  description:
    "ViraWeb é um sistema completo para clínicas e profissionais gerenciarem clientes, agendamentos e pagamentos.",
  keywords: [
    "gestão de clientes",
    "agendamentos online",
    "software para clínicas",
    "profissionais de saúde",
    "ViraWeb",
  ],
  metadataBase: new URL("https://viraweb.online"), // domínio de produção
  alternates: { canonical: "https://viraweb.online" },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    // maxSnippet/maxImagePreview/maxVideoPreview podem ser ajustados se necessário
  },
  openGraph: {
    title: "ViraWeb — Gestor de Clientes e Agendamentos",
    description:
      "Sistema para clínicas e profissionais gerenciarem clientes, agendamentos e cobranças.",
    url: "https://viraweb.online",
    siteName: "ViraWeb",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ViraWeb — Gestor de Clientes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViraWeb — Gestor de Clientes e Agendamentos",
    description:
      "Sistema para clínicas e profissionais gerenciarem clientes, agendamentos e cobranças.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/viraweb6.ico",
    shortcut: "/viraweb6.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      {/* JSON-LD: Organization & WebSite - atualize `url` e `logo` para seu domínio */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ViraWeb",
            url: "https://viraweb.online",
            logo: "https://viraweb.online/viraweb6.ico",
            sameAs: [],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ViraWeb",
            url: "https://viraweb.online",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://viraweb.online/?s={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://viraweb.online",
              },
            ],
          }),
        }}
      />
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
