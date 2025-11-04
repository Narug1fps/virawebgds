"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  getUserSettings,
  updateUserProfile,
  updateClinicInfo,
  updateEmail,
  updatePassword,
} from "@/app/actions/settings"
import { getCurrentPlan, getUserSubscription } from "@/app/actions/subscription"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PLAN_LIMITS } from "@/lib/plan-limits"
import UsageDashboard from "@/components/usage-dashboard"
import { createClient } from "@/lib/supabase-client"

export default function SettingsTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [email, setEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPlan, setCurrentPlan] = useState<"basic" | "premium" | "master">("basic")
  const [viraBotEnabled, setViraBotEnabled] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("settings-subscription-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
        },
        async () => {
          console.log(" Subscription changed, reloading settings...")
          await loadSettings()
          toast({
            title: "Configurações atualizadas",
            description: "Suas configurações foram atualizadas automaticamente.",
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  const loadSettings = async () => {
    try {
      const [settings, plan, subscription] = await Promise.all([
        getUserSettings(),
        getCurrentPlan(),
        getUserSubscription(),
      ])

      console.log(" Settings loaded:", settings)
      console.log(" Current plan loaded:", plan)
      console.log(" Subscription loaded:", subscription)

      if (settings) {
        setFullName(settings.full_name || "")
        setPhone(settings.phone || "")
        setClinicName(settings.clinic_name || "")
        setEmail(settings.email)
      }

      setCurrentPlan(plan)
      setViraBotEnabled(subscription?.virabot_enabled || false)
    } catch (error) {
      console.log(" Error loading settings:", error)
      toast({
        title: "Erro ao carregar configurações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    try {
      await updateUserProfile({ full_name: fullName, phone })
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateClinic = async () => {
    setSaving(true)
    try {
      await updateClinicInfo({ clinic_name: clinicName })
      toast({
        title: "Clínica atualizada",
        description: "Informações da clínica atualizadas com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar clínica",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um novo email",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const result = await updateEmail(newEmail)
      if (result.success) {
        toast({
          title: "Email atualizado",
          description: result.message,
        })
        setNewEmail("")
      } else {
        toast({
          title: "Erro ao atualizar email",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar email",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, confirme sua senha corretamente",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const result = await updatePassword(newPassword)
      if (result.success) {
        toast({
          title: "Senha atualizada",
          description: result.message,
        })
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Erro ao atualizar senha",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar senha",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getPlanBadge = (planType: "basic" | "premium" | "master") => {
    const badges = {
      basic: { label: "Básico", color: "bg-blue-500 text-white" },
      premium: { label: "Premium", color: "bg-purple-500 text-white" },
      master: { label: "Master", color: "bg-green-500 text-white" },
    }

    const planBadge = badges[planType]
    const planInfo = PLAN_LIMITS[planType]

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={planBadge.color}>{planBadge.label}</Badge>
          {viraBotEnabled && <Badge className="bg-purple-600 text-white">ViraBot AI Ativo</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-2">R$ {planInfo.price.toFixed(2)}/mês</p>
        <div className="text-sm text-muted-foreground space-y-1 mt-2">
          <p>
            <strong>Clientes:</strong> {planInfo.patients === "unlimited" ? "Ilimitados" : planInfo.patients}
          </p>
          <p>
            <strong>Profissionais:</strong>{" "}
            {planInfo.professionals === "unlimited" ? "Ilimitados" : planInfo.professionals}
          </p>
          <p>
            <strong>Agendamentos/mês:</strong>{" "}
            {planInfo.appointmentsPerMonth === "unlimited" ? "Ilimitados" : planInfo.appointmentsPerMonth}
          </p>
          <p>
            <strong>Suporte:</strong> {planInfo.supportHours}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UsageDashboard planType={currentPlan} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full-name" className="text-right">
                Nome Completo
              </Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
            </div>
            <Button className="mt-4" onClick={handleUpdateProfile} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clínica</CardTitle>
            <CardDescription>Atualize informações da sua clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clinic-name" className="text-right">
                Nome da Clínica
              </Label>
              <Input
                id="clinic-name"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button className="mt-4" onClick={handleUpdateClinic} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Atualize seu endereço de email.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">
                Novo Email
              </Label>
              <Input
                id="new-email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button className="mt-4" onClick={handleUpdateEmail} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Senha</CardTitle>
            <CardDescription>Atualize sua senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="confirm-password" className="text-right">
                Confirmar Senha
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button className="mt-4" onClick={handleUpdatePassword} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Plano</CardTitle>
            <CardDescription>Veja o seu plano atual.</CardDescription>
          </CardHeader>
          <CardContent>{getPlanBadge(currentPlan)}</CardContent>
        </Card>
      </div>
    </div>
  )
}
