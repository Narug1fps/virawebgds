"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Calendar, Users, BarChart3, Sparkles, Bell, CreditCard, ArrowLeft } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { useRouter } from "next/navigation"

export default function DemoPage() {
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | "master">("premium")
  const router = useRouter()

  const features = [
    {
      category: "Gerenciamento",
      items: [
        {
          name: "Gerenciamento de Clientes",
          basic: "Até 75 clientes",
          premium: "Até 500 clientes",
          master: "Ilimitado",
        },
        {
          name: "Gerenciamento de Profissionais",
          basic: "Até 7 profissionais",
          premium: "Até 50 profissionais",
          master: "Ilimitado",
        },
        {
          name: "Agendamentos",
          basic: "50/mês",
          premium: "500/mês",
          master: "Ilimitado",
        },
      ],
    },
    {
      category: "Relatórios e Análises",
      items: [
        {
          name: "Relatórios Básicos",
          basic: true,
          premium: true,
          master: true,
        },
        {
          name: "Relatórios Avançados",
          basic: false,
          premium: true,
          master: true,
        },
        {
          name: "Análise de Desempenho",
          basic: false,
          premium: true,
          master: true,
        },
      ],
    },
    {
      category: "Recursos Avançados",
      items: [
        {
          name: "IA Assistente 24/7",
          basic: false,
          premium: true,
          master: true,
        },
        {
          name: "Notificações Automáticas",
          basic: "Email",
          premium: "Email + SMS",
          master: "Email + SMS",
        },
        {
          name: "Integrações",
          basic: "Básicas",
          premium: "Avançadas",
          master: "Avançadas",
        },
      ],
    },
    {
      category: "Suporte",
      items: [
        {
          name: "Suporte por Email",
          basic: true,
          premium: true,
          master: true,
        },
        {
          name: "Suporte WhatsApp",
          basic: false,
          premium: "8h-18h (5 dias)",
          master: "24/7",
        },
        {
          name: "Suporte Prioritário",
          basic: false,
          premium: true,
          master: true,
        },
      ],
    },
  ]

  const planCards = PRODUCTS.map((product) => ({
    id: product.planType,
    name: product.name,
    price: `R$ ${(product.priceInCents / 100).toFixed(2).replace(".", ",")}`,
    period: product.billingCycle === "monthly" ? "/mês" : "pagamento único",
    description: product.description,
    highlighted: product.planType === "premium",
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background p-8">
      <div className="max-w-7xl mx-auto"><a href="/">
        
          <Button
            variant="ghost"
            className="mb-6 gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
      </a>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Comparação Completa de Planos</h1>
          <p className="text-lg text-muted-foreground">
            Veja todas as diferenças entre nossos planos e escolha o melhor para seu negócio
          </p>
        </div>

        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
            <TabsTrigger value="features">Funcionalidades</TabsTrigger>
            <TabsTrigger value="demo">Demo Interativa</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <div className="grid md:grid-cols-3 gap-6">
              {planCards.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-6 border-2 cursor-pointer transition-all ${
                    selectedPlan === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  } ${plan.highlighted ? "md:scale-105 shadow-xl" : ""}`}
                  onClick={() => setSelectedPlan(plan.id as any)}
                >
                  {plan.highlighted && (
                    <div className="mb-4 inline-block bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <Button
                    className={`w-full ${
                      selectedPlan === plan.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {selectedPlan === plan.id ? "Selecionado" : "Selecionar"}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features">
            <Card className="p-8">
              <div className="overflow-x-auto">
                {features.map((category, catIdx) => (
                  <div key={catIdx} className="mb-8 last:mb-0">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      {category.category === "Gerenciamento" && <Users className="w-5 h-5 text-primary" />}
                      {category.category === "Relatórios e Análises" && <BarChart3 className="w-5 h-5 text-primary" />}
                      {category.category === "Recursos Avançados" && <Sparkles className="w-5 h-5 text-primary" />}
                      {category.category === "Suporte" && <Bell className="w-5 h-5 text-primary" />}
                      {category.category}
                    </h3>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Funcionalidade</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Básico</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Premium</th>
                          <th className="text-center py-3 px-4 font-semibold text-foreground">Master</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((feature, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 text-foreground">{feature.name}</td>
                            <td className="text-center py-3 px-4">
                              {typeof feature.basic === "boolean" ? (
                                feature.basic ? (
                                  <Check className="w-5 h-5 text-accent mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-foreground">{feature.basic}</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {typeof feature.premium === "boolean" ? (
                                feature.premium ? (
                                  <Check className="w-5 h-5 text-accent mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-foreground">{feature.premium}</span>
                              )}
                            </td>
                            <td className="text-center py-3 px-4">
                              {typeof feature.master === "boolean" ? (
                                feature.master ? (
                                  <Check className="w-5 h-5 text-accent mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-foreground">{feature.master}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="demo">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agendamentos
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sistema completo de agendamentos com calendário visual e notificações automáticas.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-sm">Dr. Silva - 10:00</span>
                      <span className="text-xs text-accent">Confirmado</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-sm">Dra. Santos - 14:30</span>
                      <span className="text-xs text-yellow-500">Pendente</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Relatórios
                </h3>
                <p className="text-muted-foreground mb-4">
                  Planos Premium e Master incluem relatórios avançados com análises detalhadas.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Consultas este mês</span>
                        <span className="font-semibold">127</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-3/4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de ocupação</span>
                        <span className="font-semibold">85%</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  IA Assistente
                </h3>
                <p className="text-muted-foreground mb-4">
                  Exclusivo para Premium e Master: assistente com IA para otimizar seu negócio.
                </p>
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Detectei 3 horários vagos amanhã. Deseja que eu envie lembretes para clientes em lista de
                        espera?
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notificações
                </h3>
                <p className="text-muted-foreground mb-4">
                  Sistema inteligente de notificações para clientes e equipe.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                    <Bell className="w-4 h-4 text-accent mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lembrete de agendamento</p>
                      <p className="text-xs text-muted-foreground">Cliente João - Amanhã 10:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 bg-background rounded">
                    <CreditCard className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pagamento pendente</p>
                      <p className="text-xs text-muted-foreground">Cliente Maria - Vence em 3 dias</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
