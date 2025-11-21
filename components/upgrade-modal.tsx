"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Zap, X, Loader2 } from "lucide-react"
import { PLAN_LIMITS, type PlanType } from "@/lib/plan-limits"
import { useUpgradePlan } from "@/hooks/use-upgrade-plan"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: PlanType
  limitType: "patients" | "professionals" | "appointmentsPerMonth"
  currentCount: number
}

export default function UpgradeModal({ isOpen, onClose, currentPlan, limitType, currentCount }: UpgradeModalProps) {
  const { upgradePlan, isUpgrading } = useUpgradePlan()

  const limitNames = {
    patients: "clientes",
    professionals: "profissionais",
    appointmentsPerMonth: "agendamentos mensais",
  }

  const currentLimit = PLAN_LIMITS[currentPlan][limitType]

  const availablePlans: PlanType[] =
    currentPlan === "basic" ? ["premium", "master"] : currentPlan === "premium" ? ["master"] : []

  const handleUpgrade = async (planType: PlanType) => {
    try {
      await upgradePlan(planType)
      onClose()
    } catch (error) {
      console.error(" Upgrade failed:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Limite Atingido
          </DialogTitle>
          <DialogDescription className="text-base">
            Você atingiu o limite de {currentLimit} {limitNames[limitType]} do seu plano{" "}
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">Uso Atual</p>
            <p className="text-2xl font-bold text-foreground">
              {currentCount} / {currentLimit === "unlimited" ? "∞" : currentLimit}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Faça upgrade para continuar adicionando {limitNames[limitType]}.
            </p>
          </div>

          {availablePlans.length > 0 ? (
            <>
              <h3 className="font-bold text-lg mb-4">Escolha um plano para fazer upgrade:</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {availablePlans.map((planType) => {
                  const plan = PLAN_LIMITS[planType]
                  const newLimit = plan[limitType]

                  return (
                    <Card
                      key={planType}
                      className="p-6 border-2 hover:border-primary transition-colors cursor-pointer"
                      onClick={() => !isUpgrading && handleUpgrade(planType)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-xl mb-1">
                            {planType.charAt(0).toUpperCase() + planType.slice(1)}
                          </h4>
                          <p className="text-3xl font-bold text-primary">R${plan.price.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">/mês</p>
                        </div>
                        <Zap className="w-6 h-6 text-primary" />
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          {newLimit === "unlimited" ? "Ilimitado" : `Até ${newLimit}`} {limitNames[limitType]}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground">{feature}</p>
                          </div>
                        ))}
                      </div>

                      <Button className="w-full" disabled={isUpgrading}>
                        {isUpgrading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          "Fazer Upgrade"
                        )}
                      </Button>
                    </Card>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Você já está no plano Master!</h3>
              <p className="text-muted-foreground">
                Você tem acesso a todos os recursos ilimitados. Se precisar de mais, entre em contato com o suporte.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpgrading}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
