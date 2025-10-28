"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, Calendar, TrendingUp, AlertTriangle } from "lucide-react"
import { getUserUsageStats, type UsageStats } from "@/lib/usage-stats"
import { getWarningLevel, getUpgradeRecommendation } from "@/lib/usage-stats-utils"
import type { PlanType } from "@/lib/plan-limits"
import { useRouter } from "next/navigation"

interface UsageDashboardProps {
  planType: PlanType
}

export default function UsageDashboard({ planType }: UsageDashboardProps) {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getUserUsageStats(planType)
        setStats(data)
      } catch (error) {
        console.error(" Error loading usage stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [planType])

  if (loading || !stats) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    )
  }

  const resources = [
    {
      key: "patients" as const,
      icon: Users,
      label: "Clientes",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      key: "professionals" as const,
      icon: Briefcase,
      label: "Profissionais",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      key: "appointments" as const,
      icon: Calendar,
      label: "Agendamentos (mês)",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ]

  const handleUpgrade = () => {
    router.push("/dashboard?tab=subscriptions")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">Uso do Plano</h3>
        {planType !== "master" && (
          <Button onClick={handleUpgrade} size="sm" variant="outline" className="gap-2 bg-transparent">
            <TrendingUp className="w-4 h-4" />
            Fazer Upgrade
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {resources.map((resource) => {
          const data = stats[resource.key]
          const warningLevel = getWarningLevel(data.percentage)
          const Icon = resource.icon

          return (
            <Card key={resource.key} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${resource.bgColor}`}>
                  <Icon className={`w-5 h-5 ${resource.color}`} />
                </div>
                {warningLevel !== "safe" && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
              </div>

              <h4 className="font-semibold text-foreground mb-1">{resource.label}</h4>
              <p className="text-2xl font-bold text-foreground mb-2">
                {data.current} / {data.limit === "unlimited" ? "∞" : data.limit}
              </p>

              {data.limit !== "unlimited" && (
                <>
                  <Progress
                    value={data.percentage}
                    className={`mb-2 ${
                      warningLevel === "critical"
                        ? "[&>div]:bg-red-600"
                        : warningLevel === "danger"
                          ? "[&>div]:bg-orange-600"
                          : warningLevel === "warning"
                            ? "[&>div]:bg-yellow-600"
                            : "[&>div]:bg-green-600"
                    }`}
                  />
                  <p className="text-sm text-muted-foreground">
                    {data.remaining} restante{typeof data.remaining === "number" && data.remaining !== 1 ? "s" : ""}
                  </p>
                </>
              )}

              {data.limit === "unlimited" && <p className="text-sm text-green-600 font-semibold">✓ Ilimitado</p>}

              {resource.key === "appointments" && data.limit !== "unlimited" && "resetDate" in data && (
                <p className="text-xs text-muted-foreground mt-2">
                  Renova em: {new Date(data.resetDate).toLocaleDateString("pt-BR")}
                </p>
              )}

              {warningLevel !== "safe" && data.limit !== "unlimited" && planType !== "master" && (
                <p className="text-xs text-yellow-700 mt-2">{getUpgradeRecommendation(planType, resource.key)}</p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
