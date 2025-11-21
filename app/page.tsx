"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/hooks/use-toast"
import { fetchJson } from "@/lib/fetch-client"
import { useRouter } from "next/navigation"
import LandingPage from "@/components/landing-page"
import LoginPage from "@/components/login-page"
import SignupPage from "@/components/signup-page"
import Dashboard from "@/components/dashboard"
import OnboardingPlans from "@/components/onboarding-plans"
import type { User, Session, AuthError } from "@supabase/supabase-js"
import Image from "next/image"

interface AuthUser {
  id?: string
  email?: string
  name?: string
}

type UseAuthReturn = {
  user: AuthUser | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    data: { user: User | null; session: Session | null }
    error: AuthError | null
  }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    data: { user: User | null; session: Session | null }
    error: AuthError | null
  }>
  signOut: () => Promise<{ error: AuthError | null }>
  sendPasswordReset: (email: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
}

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading, signUp, signIn, signOut, sendPasswordReset, signInWithGoogle } = useAuth() as UseAuthReturn
  const { subscription, loading: subLoading } = useSubscription(user?.id || null)
  
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState<"landing" | "login" | "signup" | "onboarding" | "dashboard">("landing")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { toast } = useToast()

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      const stored = localStorage.getItem('vwd:consent_cookies')
      if (stored === 'true') setCookieConsent(true)
      else if (stored === 'false') setCookieConsent(false)
      else setCookieConsent(null)
    } catch (e) {
      setCookieConsent(null)
    }
    
    setIsHydrated(true)
  }, [])

  // If the middleware redirected to `/?goto=...`, honor that on hydration
  useEffect(() => {
    if (typeof window === 'undefined') return
    // wait for client hydration and for auth/subscription checks to finish
    if (!isHydrated || authLoading || subLoading) return

    try {
      // Prefer temporary cookie set by middleware for SPA navigation
      const cookieMatch = document.cookie.match(/(?:^|; )vwd_goto=([^;]+)/)
      const cookieGoto = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null

      if (cookieGoto) {
        if (cookieGoto === 'dashboard') setCurrentPage('dashboard')
        else if (cookieGoto === 'onboarding') setCurrentPage('onboarding')
        // remove cookie
        document.cookie = 'vwd_goto=; Max-Age=0; path=/'
        return
      }

      // Fallback to query param if cookie not present
      const params = new URLSearchParams(window.location.search)
      const goto = params.get('goto')
      if (!goto) return

      if (goto === 'dashboard') setCurrentPage('dashboard')
      else if (goto === 'onboarding') setCurrentPage('onboarding')

      // Remove the query param from the URL to keep it clean
      params.delete('goto')
      const url = new URL(window.location.href)
      url.search = params.toString()
      window.history.replaceState(null, '', url.toString())
    } catch (e) {
      // ignore
    }
  }, [isHydrated])

  // Redireciona para reset-password se o link de recuperação do Supabase for acessado
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        router.replace("/reset-password" + hash);
      }
    }
  }, []);

  // Listen to cookie consent changes
  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = () => {
      try {
        const stored = localStorage.getItem('vwd:consent_cookies')
        if (stored === 'true') setCookieConsent(true)
        else if (stored === 'false') setCookieConsent(false)
        else setCookieConsent(null)
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('vwd:consent_changed', handler)
    window.addEventListener('storage', handler)
    // Listen for goto events dispatched by middleware or other UI (e.g. CookieConsent)
    const gotoHandler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail
        if (detail === 'dashboard') setCurrentPage('dashboard')
        else if (detail === 'onboarding') setCurrentPage('onboarding')
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('vwd:goto', gotoHandler as EventListener)
    
    return () => {
      window.removeEventListener('vwd:consent_changed', handler)
      window.removeEventListener('storage', handler)
      window.removeEventListener('vwd:goto', gotoHandler as EventListener)
    }
  }, [])

  // Main navigation logic - use all loading states properly
  useEffect(() => {
    // Wait for hydration first
    if (!isHydrated) {
      return
    }

    // Still loading user or subscription, wait
    if (authLoading || subLoading) {
      return
    }

    // If cookies not accepted: show landing with cookie card
    if (cookieConsent !== true) {
      setCurrentPage("landing")
      return
    }

    // Cookies accepted: check auth and subscription
    if (!user) {
      setCurrentPage("landing")
      return
    }

    // User is logged in, check subscription
    if (user && !subscription) {
      setCurrentPage("onboarding")
      return
    }

    if (user && subscription) {
      setCurrentPage("dashboard")
      return
    }
  }, [isHydrated, authLoading, subLoading, user, subscription, cookieConsent])

  const handleLogin = async (email: string, password: string) => {
    setIsProcessing(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: "Email ou senha incorretos",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta",
        })
      }
    } catch (err) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSignup = async (name: string, email: string, password: string) => {
    setIsProcessing(true)
    try {
      const { error } = await signUp(email, password)
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsNewUser(true)
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar sua conta",
        })
      }
    } catch (err) {
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectPlan = async (plan: "basic" | "premium" | "master") => {
    setIsProcessing(true)
    try {
      await fetchJson("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: plan }),
      })

      toast({
        title: "Plano selecionado!",
        description: "Seu plano foi ativado com sucesso",
      })

      setCurrentPage("dashboard")
    } catch (err) {
      toast({
        title: "Erro ao selecionar plano",
        description: err instanceof Error ? err.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setCurrentPage("landing")
  }

  const handleGoogleSignIn = async () => {
    setIsProcessing(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        const msg = (error && (error as any).message) || String(error || '')
        if (msg.toLowerCase().includes('provider is not enabled') || msg.toLowerCase().includes('unsupported provider')) {
          toast({
            title: 'Login com Google indisponível',
            description:
              'O provedor Google não está habilitado no painel Supabase. Ative-o em Supabase Auth → Providers e configure as credenciais OAuth (Client ID / Client Secret). Depois adicione a URL de redirect nas configurações.',
            variant: 'destructive',
          })
        } else {
          toast({ title: 'Erro no login com Google', description: msg, variant: 'destructive' })
        }
      }
      // For OAuth flows Supabase will redirect the user; no further client-side handling required here
    } catch (err) {
      toast({ title: "Erro no login com Google", description: "Tente novamente", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleForgotPassword = async (email?: string) => {
    try {
      let userEmail = email
      if (!userEmail) {
        // Redirect to email input page
        router.push('/email-input')
        return
      }
      if (!userEmail) return

      const { error } = await sendPasswordReset(userEmail)
      if (error) {
        toast({ title: 'Erro', description: error.message || 'Não foi possível enviar o email', variant: 'destructive' })
      } else {
        toast({ title: 'Email enviado', description: 'Verifique sua caixa de entrada para o link de reset' })
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível processar sua solicitação', variant: 'destructive' })
    }
  }

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Image src="/viraweb6.ico" width={256} height={159} alt="" className="w-30" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {currentPage === "landing" && (
        <LandingPage onLoginClick={() => setCurrentPage("login")} onSignupClick={() => setCurrentPage("signup")} />
      )}
      {currentPage === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onSignupClick={() => setCurrentPage("signup")}
          onBackClick={() => setCurrentPage("landing")}
          onForgotPassword={() => handleForgotPassword()}
          onGoogleSignIn={() => handleGoogleSignIn()}
        />
      )}
      {currentPage === "signup" && (
        <SignupPage
          onSignup={handleSignup}
          onLoginClick={() => setCurrentPage("login")}
          onBackClick={() => setCurrentPage("landing")}
          onGoogleSignIn={() => handleGoogleSignIn()}
        />
      )}
      {currentPage === "onboarding" && user && (
        <OnboardingPlans onSelectPlan={handleSelectPlan} isLoading={isProcessing} />
      )}
      {currentPage === "dashboard" && user && subscription && (
        <Dashboard
          user={{
            email: user?.email ?? "",
            name: user?.name ?? user?.email?.split("@")[0] ?? "Usuário",
          }}
          onLogout={handleLogout}
          subscription={subscription}
          isNewUser={isNewUser}
        />
      )}
    </main>
  )
}
