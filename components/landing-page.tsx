"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Calendar,
  Users,
  BarChart3,
  CreditCard,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Star,
  Brain,
  MessageSquare,
  TrendingUp,
  ArrowLeft,
} from "lucide-react"
import DashboardPreview from "@/components/dashboard-preview"
import DemoPage from "@/components/demo-page"
import { PRODUCTS } from "@/lib/products"
import Image from "next/image"

interface LandingPageProps {
  onLoginClick: () => void
  onSignupClick: () => void
}

export default function LandingPage({ onLoginClick, onSignupClick }: LandingPageProps) {
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      let ultimaPosicao = 0
      window.addEventListener("scroll", () => {
        const nav: any = document.querySelector("#nav")
        const atualPosicao = window.scrollY

        if (atualPosicao > ultimaPosicao && atualPosicao > 0) {
          nav.style.transform = "translateY(-100%)"
        } else {
          nav.style.transform = "translateY(0%)"
        }
        if (atualPosicao < 80) {
          nav.style.transform = "translateY(0%)"
          nav.style.transition = "0.5s"
        }
        ultimaPosicao = atualPosicao
      })
    }
  }, [])

  if (showDemo) {
    return (
      <div>
        <DemoPage />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        id="nav"
        className=" top-0 z-50 sticky border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <a href="#">
              <Image width={512} height={512} alt="" src="/viraweb3.png" className="w-40" />
            </a>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onLoginClick} className="text-foreground hover:bg-muted">
              Entrar
            </Button>
            <Button
              onClick={onSignupClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              Começar
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-secondary/20 rounded-full border-2 border-secondary">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Transforme seu negócio hoje
              </p>
            </div>

            <h2 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Gerenciamento Completo de <span className="text-primary">Clientes</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance leading-relaxed">
              Organize agendamentos, clientes, profissionais e relatórios em uma única plataforma. Perfeito para
              clínicas, barbearias, escritórios de psicologia e muito mais.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                onClick={onSignupClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg group"
              >
                Começar Agora
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowDemo(true)}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Ver Demo
              </Button>
            </div>
          </div>

          <div className="mt-16">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ViraBot AI Feature Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-6 py-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border-2 border-primary/30">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                Powered by AI
              </p>
            </div>
            <h3 className="text-4xl sm:text-5xl font-bold text-white mb-6 text-balance">
              Conheça o{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ViraBot IA
              </span>
            </h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto text-balance leading-relaxed">
              Seu assistente inteligente que revoluciona a gestão do seu negócio com inteligência artificial de última
              geração
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left: AI Visual */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">ViraBot</h4>
                      <p className="text-xs text-gray-400">Assistente IA</p>
                    </div>
                  </div>

                  {/* Chat simulation */}
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-sm text-white">Quantos agendamentos tenho hoje?</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 border border-primary/30">
                      <p className="text-sm text-white mb-2">
                        Você tem <strong>12 agendamentos</strong> hoje:
                      </p>
                      <ul className="text-xs text-gray-300 space-y-1 ml-4">
                        <li>• 8 consultas confirmadas</li>
                        <li>• 3 aguardando confirmação</li>
                        <li>• 1 cancelamento</li>
                      </ul>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                      <p className="text-sm text-white">Como posso melhorar a taxa de ocupação?</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 border border-primary/30">
                      <p className="text-sm text-white">Baseado nos seus dados, sugiro...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Features */}
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Conversas Naturais</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Converse naturalmente com o ViraBot como se fosse um assistente humano. Faça perguntas sobre seu
                    negócio e receba respostas instantâneas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Análise Inteligente</h4>
                  <p className="text-gray-300 leading-relaxed">
                    O ViraBot analisa seus dados e identifica padrões, tendências e oportunidades de melhoria para seu
                    negócio.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Insights Acionáveis</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Receba sugestões práticas e personalizadas para otimizar processos, aumentar eficiência e melhorar
                    resultados.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Automação Inteligente</h4>
                  <p className="text-gray-300 leading-relaxed">
                    Automatize tarefas repetitivas e deixe o ViraBot cuidar do trabalho pesado enquanto você foca no
                    atendimento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-2 border-primary/30 backdrop-blur">
              <p className="text-white mb-4 text-lg">
                <strong>ViraBot IA</strong> está disponível nos planos <span className="text-secondary">Premium</span> e{" "}
                <span className="text-secondary">Vitalício</span>
              </p>
              <Button
                size="lg"
                onClick={onSignupClick}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Começar com ViraBot
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Tudo que você precisa</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recursos poderosos projetados para negócios de agendamento modernos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Calendar className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Agendamentos</h4>
              <p className="text-muted-foreground leading-relaxed">
                Gerencie agendamentos com facilidade, evite conflitos e otimize o tempo dos profissionais.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Users className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Gestão de Clientes</h4>
              <p className="text-muted-foreground leading-relaxed">
                Mantenha histórico completo de clientes, agendamentos e serviços em um só lugar.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <BarChart3 className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Relatórios</h4>
              <p className="text-muted-foreground leading-relaxed">
                Analise dados, acompanhe desempenho e tome decisões baseadas em informações reais.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <CreditCard className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Financeiro Inteligente</h4>
              <p className="text-muted-foreground leading-relaxed">
                Controle pagamentos, descontos e presença automaticamente. Relatórios diários, semanais e mensais
                com gráficos e visão completa do fluxo de caixa.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Clock className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Eficiência</h4>
              <p className="text-muted-foreground leading-relaxed">
                Economize tempo com automação e processos otimizados para seu negócio.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Shield className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Segurança</h4>
              <p className="text-muted-foreground leading-relaxed">
                Dados protegidos com criptografia e conformidade com regulamentações de saúde.
              </p>
            </Card>

            <Card className="p-8 border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 group bg-card">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                <Zap className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h4 className="text-xl font-bold text-foreground mb-2">Rápido</h4>
              <p className="text-muted-foreground leading-relaxed">
                Interface responsiva e rápida que funciona perfeitamente em qualquer dispositivo.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-4 py-2 bg-secondary/20 rounded-full border-2 border-secondary">
              <p className="text-sm font-semibold text-foreground">💎 Planos Premium</p>
            </div>
            <h3 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Escolha o Plano Ideal</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transparência total. Sem taxas ocultas. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {PRODUCTS.map((product, index) => (
              <Card
                key={product.id}
                className={`relative p-8 border-2 transition-all duration-300 hover:shadow-2xl ${
                  product.planType === "premium"
                    ? "border-secondary bg-gradient-to-br from-secondary/10 via-background to-primary/5 md:scale-105 shadow-xl"
                    : "border-border hover:border-primary bg-card"
                }`}
              >
                {product.planType === "premium" && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Mais Popular
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-foreground mb-2">{product.name}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-primary">
                      R$ {(product.priceInCents / 100).toFixed(0)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {product.billingCycle === "monthly" ? "/mês" : "único"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onSignupClick}
                  className={`w-full mb-8 h-12 text-base font-semibold transition-all ${
                    product.planType === "premium"
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl hover:scale-105"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  Escolher {product.name}
                </Button>

                <div className="space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Recursos Inclusos
                  </div>
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setShowDemo(true)}
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Comparar Planos em Detalhes
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Por que escolher ViraWeb?</h3>
              <ul className="space-y-4">
                {[
                  "Reduz tempo administrativo em até 70%",
                  "Aumenta satisfação dos clientes",
                  "Melhora organização do negócio",
                  "Suporte técnico dedicado",
                  "Integração com sistemas existentes",
                  "Backup automático de dados",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-foreground leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl overflow-hidden border border-border shadow-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                <Users className="w-24 h-24 text-primary/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-balance">Pronto para transformar seu negócio?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto text-balance leading-relaxed">
            Escolha seu plano e comece a usar ViraWeb hoje. Veja como podemos melhorar significativamente a gestão do
            seu negócio.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={onSignupClick}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Começar Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onLoginClick}
              className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <a href="#">
                  <Image width={512} height={512} alt="" src="/viraweb3.png" className="w-40" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Gerenciamento completo para negócios de agendamento modernos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Segurança
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Termos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    LGPD
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ViraWeb. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
