"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function CookieConsent() {
  const [consent, setConsent] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    try {
      const stored = localStorage.getItem("vwd:consent_cookies")
      setConsent(stored)
    } catch (e) {
      setConsent(null)
    }
  }, [])

  const accept = async () => {
    try {
      localStorage.setItem("vwd:consent_cookies", "true")
      setConsent("true")

      try {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new Event("vwd:consent_changed"))
        }
      } catch (e) {}

      try {
        const consentRes = await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ consent: true }),
        })
        console.log("[CookieConsent] /api/consent response:", consentRes.status)
      } catch (e) {
        console.warn("[CookieConsent] failed to persist consent server-side", e)
      }

      try {
        const redirectRes = await fetch("/api/ssr/redirect-check", {
          method: "GET",
          credentials: "same-origin",
        })
        if (redirectRes.ok) {
          const json = await redirectRes.json()
          const target: string | null = typeof json?.target === "string" ? json.target : null
          console.log("[CookieConsent] redirect-check returned target:", target)
          if (target) {
            // parse for goto param
            try {
              const url = new URL(target, window.location.href)
              const goto = url.searchParams.get("goto")
              if (goto && typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
                console.log("[CookieConsent] dispatching vwd:goto event with detail:", goto)
                window.dispatchEvent(new CustomEvent("vwd:goto", { detail: goto }))
              }
            } catch (e) {
              console.warn("[CookieConsent] failed to parse target URL", e)
            }
          }
        }
      } catch (e) {
        console.warn("[CookieConsent] failed to get redirect target", e)
      }
    } catch (e) {
      console.error("[CookieConsent] error in accept:", e)
    }
  }

  const decline = () => {
    try {
      localStorage.setItem("vwd:consent_cookies", "false")
      setConsent("false")
      try {
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new Event("vwd:consent_changed"))
        }
      } catch (e) {}
      try {
        fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ consent: false }),
        })
      } catch (e) {}
    } catch (e) {
      console.error("[CookieConsent] error in decline:", e)
    }
  }

  // If user already made a choice, don't render
  if (!isHydrated || consent === "true" || consent === "false") return null

  return (
    <div className="fixed bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 z-50 flex flex-col md:flex-row items-start md:items-center justify-between bg-card border border-border p-3 md:p-4 rounded-lg shadow-md max-w-4xl mx-auto gap-3 md:gap-4">
      <div className="flex-1">
        <p className="text-xs md:text-sm leading-relaxed">
          Usamos cookies para manter você conectado e melhorar a experiência. Deseja ativar cookies?
        </p>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button
          variant="outline"
          onClick={decline}
          className="flex-1 md:flex-none text-xs md:text-sm h-8 md:h-10 bg-transparent"
        >
          Recusar
        </Button>
        <Button onClick={accept} className="flex-1 md:flex-none text-xs md:text-sm h-8 md:h-10">
          Ativar cookies
        </Button>
      </div>
    </div>
  )
}
