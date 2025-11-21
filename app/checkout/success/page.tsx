"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { handleCheckoutSuccess } from "@/app/actions/stripe"
import { useToast } from "@/hooks/use-toast"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const sessionId = searchParams?.get("session_id") ?? null

    if (!sessionId) {
      setStatus("error")
      setError("Session ID not found")
      return
    }

    handleCheckoutSuccess(sessionId)
      .then(() => {
        setStatus("success")
        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada com sucesso. Redirecionando...",
        })
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      })
      .catch((err) => {
        setStatus("error")
        setError(err.message || "Failed to process payment")
        toast({
          title: "Erro no pagamento",
          description: err.message || "Falha ao processar o pagamento",
          variant: "destructive",
        })
      })
  }, [searchParams, router, toast])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Processando pagamento..."}
            {status === "success" && "Pagamento confirmado!"}
            {status === "error" && "Erro no pagamento"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Aguarde enquanto confirmamos seu pagamento...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="text-lg font-semibold text-foreground">Sua assinatura foi ativada com sucesso!</p>
              <p className="text-muted-foreground">Você será redirecionado para o dashboard em instantes...</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                Ir para o Dashboard
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-3xl">✕</span>
              </div>
              <p className="text-lg font-semibold text-foreground">Ocorreu um erro</p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => router.push("/")} variant="outline" className="mt-4">
                Voltar ao início
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
