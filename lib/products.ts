export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  planType: "basic" | "premium" | "master"
  features: string[]
  billingCycle?: "monthly" | "one_time"
}

export const PRODUCTS: Product[] = [
  {
    id: "basic-plan",
    name: "Plano Básico",
    description: "Perfeito para começar sua clínica",
    priceInCents: 7490, // R$ 74,90
    planType: "basic",
    billingCycle: "monthly",
    features: [
      "Até 75 pacientes",
      "Até 7 profissionais",
      "50 agendamentos/mês",
      "Relatórios básicos",
      "Suporte via email",
    ],
  },
  {
    id: "premium-plan",
    name: "Plano Premium",
    description: "Recursos avançados com IA",
    priceInCents: 14990, // R$ 149,90
    planType: "premium",
    billingCycle: "monthly",
    features: [
      "Até 500 pacientes",
      "Até 50 profissionais",
      "500 agendamentos/mês",
      "Relatórios avançados",
      "ViraBot AI 24/7",
      "Suporte prioritário",
      "Suporte via email e WhatsApp",
      "Horário: 8:00-18:00 (5 dias/semana)",
    ],
  },
  {
    id: "master-plan",
    name: "Plano Master",
    description: "Recursos ilimitados e suporte premium",
    priceInCents: 24990, // R$ 249,90
    planType: "master",
    billingCycle: "monthly",
    features: [
      "Pacientes ilimitados",
      "Profissionais ilimitados",
      "Agendamentos ilimitados",
      "Relatórios avançados",
      "ViraBot AI 24/7",
      "Suporte prioritário 24/7",
      "Suporte via email e WhatsApp",
      "Gerente de conta dedicado",
    ],
  },
]

export function getProductByPlanType(planType: "basic" | "premium" | "master"): Product | undefined {
  return PRODUCTS.find((p) => p.planType === planType)
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
