"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { startCheckoutSession } from "@/app/actions/stripe"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CheckoutButtonProps {
  planType: "basic" | "premium" | "master"
  children: React.ReactNode
  className?: string
  variant?: "default" | "outline" | "ghost"
}

export default function CheckoutButton({ planType, children, className, variant = "default" }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const checkoutUrl = await startCheckoutSession(planType)
      window.location.href = checkoutUrl
    } catch (error) {
      console.error(" Checkout error:", error)
      toast({
        title: "Erro ao iniciar checkout",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className={className} variant={variant}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
