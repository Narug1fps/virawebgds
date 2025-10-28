"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

type PlanType = "basic" | "premium" | "master"

export function useUpgradePlan() {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { toast } = useToast()

  const upgradePlan = async (newPlan: PlanType) => {
    setIsUpgrading(true)

    toast({
      title: "Redirecionando para pagamento...",
      description: "Você será redirecionado para o checkout seguro do Stripe.",
    })

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan: newPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error) {
      toast({
        title: "Erro ao iniciar upgrade",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
      setIsUpgrading(false)
      throw error
    }
  }

  return {
    upgradePlan,
    isUpgrading,
  }
}
