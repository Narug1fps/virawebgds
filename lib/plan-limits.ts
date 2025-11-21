export type PlanType = "basic" | "premium" | "master"

export interface PlanLimits {
  patients: number | "unlimited"
  professionals: number | "unlimited"
  appointmentsPerMonth: number | "unlimited"
  support: string[]
  features: string[]
  price: number
  supportHours: string
  viraBotEnabled: boolean
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  basic: {
    patients: 75,
    professionals: 7,
    appointmentsPerMonth: 50,
    support: ["Email"],
    features: ["Gestão básica de clientes", "Agendamentos limitados", "Relatórios básicos", "Suporte via email"],
    price: 74.9,
    supportHours: "Horário comercial",
    viraBotEnabled: false,
  },
  premium: {
    patients: 500,
    professionals: 50,
    appointmentsPerMonth: 500,
    support: ["Email", "WhatsApp"],
    features: [
      "500 clientes",
      "50 profissionais",
      "500 agendamentos/mês",
      "ViraBot AI 24/7",
      "Suporte prioritário",
      "Email e WhatsApp",
      "Suporte 8:00-18:00 (5 dias por semana)",
    ],
    price: 149.9,
    supportHours: "8:00 às 18:00 (5 dias por semana)",
    viraBotEnabled: true,
  },
  master: {
    patients: "unlimited",
    professionals: "unlimited",
    appointmentsPerMonth: "unlimited",
    support: ["Email", "WhatsApp", "24/7"],
    features: [
      "Clientes ilimitados",
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "ViraBot AI 24/7",
      "Suporte prioritário 24/7",
      "Email e WhatsApp",
      "Suporte 24 horas",
    ],
    price: 249.9,
    supportHours: "24 horas, 7 dias por semana",
    viraBotEnabled: true,
  },
}

export function getPlanLimit(planType: PlanType | null, limitType: keyof PlanLimits): number | "unlimited" {
  if (!planType) return 0
  const limit = PLAN_LIMITS[planType][limitType]
  return typeof limit === "number" || limit === "unlimited" ? limit : 0
}

export function canAddPatient(planType: PlanType | null, currentCount: number): boolean {
  const limit = getPlanLimit(planType, "patients")
  if (limit === "unlimited") return true
  return currentCount < (limit as number)
}

export function canAddProfessional(planType: PlanType | null, currentCount: number): boolean {
  const limit = getPlanLimit(planType, "professionals")
  if (limit === "unlimited") return true
  return currentCount < (limit as number)
}

export function canAddAppointment(planType: PlanType | null, currentMonthCount: number): boolean {
  const limit = getPlanLimit(planType, "appointmentsPerMonth")
  if (limit === "unlimited") return true
  return currentMonthCount < (limit as number)
}

export function hasAIAccess(planType: PlanType | null): boolean {
  return planType === "premium" || planType === "master"
}

export function getSupportChannels(planType: PlanType | null): string[] {
  if (!planType) return []
  return PLAN_LIMITS[planType].support
}

export function getSupportHours(planType: PlanType | null): string {
  if (!planType) return ""
  return PLAN_LIMITS[planType].supportHours
}

export function hasViraBotAccess(planType: PlanType | null): boolean {
  if (!planType) return false
  return PLAN_LIMITS[planType].viraBotEnabled
}
