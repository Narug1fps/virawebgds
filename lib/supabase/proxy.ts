import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // Wrap in try-catch to handle Supabase connection issues gracefully
    try {
      await supabase.auth.getUser()
    } catch (e) {
      // Silently fail if Supabase is unreachable
      console.error("[updateSession] Failed to get user:", e)
    }
  } catch (e) {
    console.error("[updateSession] Failed to create Supabase client:", e)
  }

  return supabaseResponse
}

