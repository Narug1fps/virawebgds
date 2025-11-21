"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Memoize supabase client to avoid recreating on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing auth...')
        // First, get the current user from the session
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        
        console.log('[useAuth] Got current user:', !!currentUser, currentUser?.email)
        if (isMounted) {
          setUser(currentUser)
          setLoading(false)
        }
      } catch (error) {
        console.error('[useAuth] Error getting user:', error)
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useAuth] Auth state changed:', _event, 'user:', !!session?.user, session?.user?.email)
      if (isMounted) {
        setUser(session?.user || null)
      }

      // Only persist session server-side if user consented to cookies
      try {
        const consent = localStorage.getItem('vwd:consent_cookies')
        const forcePersist = (process.env.NEXT_PUBLIC_FORCE_PERSIST_SESSION || '') === 'true'
        if (consent === 'true' || forcePersist) {
          console.log('[useAuth] Persisting session to server')
          // fire-and-forget - server helper will set cookies from event+session
          fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ event: _event, session }),
          }).catch((e) => {
            console.debug('Failed to persist auth cookie', e)
          })
        }
      } catch (e) {
        console.debug('Error while attempting to persist auth cookie', e)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      },
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const sendPasswordReset = async (email: string) => {
    // Send password reset email via Supabase
    // Uses Supabase JS v2 API: resetPasswordForEmail
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    // Start OAuth flow via Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    signInWithGoogle,
  }
}
