import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  try {
    // First, call existing supabase session updater so auth cookies are set correctly
    const supabaseResp = await updateSession(request)

    const url = request.nextUrl.clone()

    // Only run our redirect logic for homepage root '/'
    if (url.pathname !== "/") {
      return supabaseResp
    }

    const consentCookie = request.cookies.get("vwd:consent")?.value
    const hasConsent = consentCookie === "true"

    if (!hasConsent) {
      return supabaseResp
    }

    const apiUrl = new URL("/api/ssr/redirect-check", request.url)
    console.log("[middleware] consent accepted, calling /api/ssr/redirect-check")
    const apiRes = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: request.headers,
      cache: "no-store",
    })

    console.log("[middleware] redirect-check status:", apiRes.status)

    if (!apiRes.ok) return supabaseResp

    const data = await apiRes.json()
    const target = typeof data?.target === "string" ? data.target : null

    if (!target) {
      console.log("[middleware] no target returned - nothing to do")
      return supabaseResp
    }

    console.log("[middleware] got target from redirect-check ->", target)

    // If we're already at the target, allow render
    if (url.pathname === target) return supabaseResp

    // Avoid redirect loops: if target is '/' just continue
    if (target === "/") return supabaseResp

    // If the target is a root query `/?goto=...`, set a short-lived cookie so the client SPA can
    // react without a full redirect (this mimics pressing the client 'Entrar' button)
    try {
      const parsed = new URL(target, request.url)
      const goto = parsed.searchParams.get("goto")
      if (parsed.pathname === "/" && goto) {
        // set temporary cookie instructing client what to open
        const cookieName = "vwd_goto"
        try {
          supabaseResp.cookies.set(cookieName, goto, { path: "/", maxAge: 10 })
          console.log("[middleware] set vwd_goto cookie ->", goto)
        } catch (e) {
          console.warn("[middleware] failed to set cookie via cookies API, falling back to header", e)
          try {
            // Fallback: set header directly
            const serialized = `${cookieName}=${encodeURIComponent(goto)}; Path=/; Max-Age=10`
            supabaseResp.headers.append("set-cookie", serialized)
          } catch (err) {
            console.error("[middleware] fallback set-cookie append failed", err)
          }
        }
        return supabaseResp
      }
    } catch (e) {
      // ignore parse errors and fall back to redirect
    }

    // Fallback: perform a redirect
    const dest = new URL(target, request.url)
    const redirectResp = NextResponse.redirect(dest)
    try {
      const setCookie = supabaseResp.headers.get("set-cookie")
      if (setCookie) {
        redirectResp.headers.append("set-cookie", setCookie)
      }
    } catch (e) {
      // ignore header forwarding failures
    }

    return redirectResp
  } catch (err) {
    console.error("Middleware error:", err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
