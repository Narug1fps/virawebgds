"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, Clock, CheckCircle2, AlertCircle, Loader2, Send, Sparkles, ExternalLink } from "lucide-react"
import {
  getSupportTickets,
  createSupportTicket,
  getTicketMessages,
  addTicketMessage,
  type SupportTicket,
  type SupportMessage,
} from "@/app/actions/support"
import { getCurrentPlan } from "@/app/actions/subscription"
import { hasViraBotAccess, PLAN_LIMITS, getSupportChannels } from "@/lib/plan-limits"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AIAssistant from "@/components/ai-assistant"

export default function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [supportChannels, setSupportChannels] = useState<string[]>([])
  const [planType, setPlanType] = useState<"basic" | "premium" | "master">("basic")
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  })
  const [showAIChat, setShowAIChat] = useState(false)
  const [hasAIAccess, setHasAIAccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ticketsData, plan] = await Promise.all([getSupportTickets(), getCurrentPlan()])

      console.log(" Support tickets loaded:", ticketsData)
      console.log(" Current plan:", plan)

      setTickets(ticketsData)
      setPlanType(plan)
      setSupportChannels(getSupportChannels(plan))
      setHasAIAccess(hasViraBotAccess(plan))
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!formData.subject || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o assunto e a mensagem",
        variant: "destructive",
      })
      return
    }

    try {
      await createSupportTicket(formData.subject, formData.message, formData.priority)
      toast({
        title: "Ticket criado",
        description: "Seu ticket de suporte foi criado e enviado para nossa equipe",
      })
      setFormData({ subject: "", message: "", priority: "medium" })
      setShowNewTicket(false)
      await loadData()
    } catch (error) {
      toast({
        title: "Erro ao criar ticket",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    try {
      const messagesData = await getTicketMessages(ticket.id)
      setMessages(messagesData)
    } catch (error) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return

    try {
      await addTicketMessage(selectedTicket.id, newMessage)
      const messagesData = await getTicketMessages(selectedTicket.id)
      setMessages(messagesData)
      setNewMessage("")
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada para nossa equipe",
      })
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Aberto", className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "Em Progresso", className: "bg-yellow-100 text-yellow-700" },
      resolved: { label: "Resolvido", className: "bg-green-100 text-green-700" },
      closed: { label: "Fechado", className: "bg-gray-100 text-gray-700" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "Baixa", className: "bg-gray-100 text-gray-700" },
      medium: { label: "Média", className: "bg-blue-100 text-blue-700" },
      high: { label: "Alta", className: "bg-orange-100 text-orange-700" },
      urgent: { label: "Urgente", className: "bg-red-100 text-red-700" },
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getSupportInfo = () => {
    const planInfo = PLAN_LIMITS[planType]

    if (planType === "basic") {
      return {
        title: "Suporte via Email",
        description: "Resposta em até 48 horas úteis",
        hours: planInfo.supportHours,
        features: planInfo.features,
      }
    } else if (planType === "premium") {
      return {
        title: "Suporte Prioritário + ViraBot IA",
        description: "Email e WhatsApp - Resposta em até 4 horas + Chat IA 24/7",
        hours: planInfo.supportHours,
        features: planInfo.features,
      }
    } else if (planType === "master") {
      return {
        title: "Suporte Premium 24/7 + ViraBot IA",
        description: "Email e WhatsApp - Resposta imediata + Chat IA 24/7",
        hours: planInfo.supportHours,
        features: planInfo.features,
      }
    }

    return {
      title: "Suporte",
      description: "Entre em contato conosco",
      hours: "Horário comercial",
      features: [],
    }
  }

  const supportInfo = getSupportInfo()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (showAIChat && hasAIAccess) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowAIChat(false)} className="mb-4">
          ← Voltar para Suporte
        </Button>
        <AIAssistant hasAccess={hasAIAccess} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Suporte</h2>
          <p className="text-muted-foreground mt-1">Central de ajuda e atendimento</p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Novo Ticket
        </Button>
      </div>

      {/* Support Info Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary rounded-lg text-white">
            <ExternalLink className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-2">{supportInfo.title}</h3>
            <p className="text-muted-foreground mb-4">{supportInfo.description}</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Horário de Atendimento</p>
                  <p className="text-sm text-muted-foreground">{supportInfo.hours}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Canais Disponíveis</p>
                  <p className="text-sm text-muted-foreground">Email, WhatsApp{hasAIAccess && ", ViraBot IA"}</p>
                </div>
              </div>
            </div>

            {supportInfo.features && supportInfo.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {supportInfo.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} className="bg-primary/10 text-primary">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {hasAIAccess && (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-lg text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">ViraBot IA - Assistente 24/7</h3>
              <p className="text-muted-foreground mb-4">
                Converse com nosso assistente inteligente para obter ajuda instantânea sobre o sistema, tirar dúvidas e
                receber orientações em tempo real.
              </p>
              <Button
                onClick={() => setShowAIChat(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Chat com ViraBot
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-bold text-foreground mb-2">Email</h4>
          <p className="text-sm text-muted-foreground mb-3">viraweb.online@gmail.com</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => window.open("mailto:viraweb.online@gmail.com", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Enviar Email
          </Button>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-bold text-foreground mb-2">WhatsApp</h4>
          <p className="text-sm text-muted-foreground mb-3">(62) 9 9246-6109</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            onClick={() => window.open("https://wa.me/5562992466109", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir WhatsApp
          </Button>
        </Card>
      </div>

      {/* Help Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Recursos de Ajuda</h3>
        <div className="space-y-3">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-foreground mb-1">📚 Central de Ajuda</h4>
            <p className="text-sm text-muted-foreground">Acesse nossa documentação completa e tutoriais em vídeo</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-foreground mb-1">💡 Perguntas Frequentes</h4>
            <p className="text-sm text-muted-foreground">Encontre respostas rápidas para dúvidas comuns</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-foreground mb-1">🎥 Tutoriais em Vídeo</h4>
            <p className="text-sm text-muted-foreground">Aprenda a usar todos os recursos do sistema</p>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Meus Tickets</h3>
        <div className="space-y-3">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{ticket.subject}</h4>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Criado em {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum ticket de suporte criado</p>
              <Button onClick={() => setShowNewTicket(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Ticket
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Ticket de Suporte</DialogTitle>
            <DialogDescription>Descreva seu problema ou dúvida e nossa equipe entrará em contato</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Assunto</label>
              <Input
                placeholder="Descreva brevemente o problema"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Prioridade</label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mensagem</label>
              <Textarea
                placeholder="Descreva detalhadamente seu problema ou dúvida..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[150px]"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTicket} className="flex-1">
                Criar Ticket
              </Button>
              <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Messages Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <div className="flex gap-2 mt-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
              {selectedTicket && getPriorityBadge(selectedTicket.priority)}
            </div>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${message.is_staff ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {message.is_staff ? "Equipe de Suporte" : "Você"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-foreground">{message.message}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
