import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  try {
    // Call supabase session updater so auth cookies are set correctly
    const supabaseResp = await updateSession(request)
    return supabaseResp
  } catch (err) {
    console.error("Middleware error:", err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
