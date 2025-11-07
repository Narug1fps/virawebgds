"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, Search, Mail, Phone, Briefcase, Badge, Loader2 } from "lucide-react"
import {
  getProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
  type Professional as ProfessionalType,
} from "@/app/actions/professionals"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import PlanLimitBanner from "@/components/plan-limit-banner"
import { useRouter } from "next/navigation"
import UpgradeModal from "@/components/upgrade-modal"
import { getCurrentPlan } from "@/app/actions/subscription"
import { checkLimit } from "@/lib/usage-stats"

type Professional = ProfessionalType

export default function ProfessionalsTab() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<"basic" | "premium" | "master">("basic")
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    work_days: "",
    notes: "",
  })
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProfessionals()
    loadPlan()
  }, [])

  const loadPlan = async () => {
    try {
      const plan = await getCurrentPlan()
      setCurrentPlan(plan)
    } catch (error) {
      console.error(" Error loading plan:", error)
    }
  }

  const loadProfessionals = async () => {
    try {
      const data = await getProfessionals()
      setProfessionals(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar profissionais",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddProfessional = async () => {
    setSaving(true)
    if (!formData.name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, preencha o nome do profissional",
        variant: "destructive",
      })
      return
    }

    if (!editingId) {
      try {
        const limitCheck = await checkLimit(currentPlan, "professionals")
        if (!limitCheck.allowed) {
          setShowUpgradeModal(true)
          return
        }
      } catch (error) {
        console.error(" Error checking limit:", error)
      }
    }

    try {
      if (editingId) {
        await updateProfessional(editingId, formData)
        toast({
          title: "Profissional atualizado",
          description: "As informações foram atualizadas com sucesso",
        })
      } else {
        await createProfessional(formData)
        toast({
          title: "Profissional criado",
          description: "Novo profissional adicionado com sucesso",
        })
      }

      await loadProfessionals()
      setFormData({ name: "", specialty: "", email: "", phone: "", work_days: "", notes: "" })
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      if (error instanceof Error && error.message.includes("Limite")) {
        setShowUpgradeModal(true)
      } else {
        toast({
          title: "Erro ao salvar profissional",
          description: error instanceof Error ? error.message : "Tente novamente",
          variant: "destructive",
        })
      }
    }
    finally{
      setSaving(false)
    }
  }

  const handleEditProfessional = (professional: Professional) => {
    setFormData({
      name: professional.name,
      specialty: professional.specialty || "",
      email: professional.email || "",
      phone: professional.phone || "",
      work_days: professional.work_days || "",
      notes: professional.notes || "",
    })
    setEditingId(professional.id)
    setShowForm(true)
  }

  const handleDeleteProfessional = async (id: string) => {
    const t = toast({
      title: "Confirmar exclusão?",
      description: "Clique em Excluir para confirmar ou feche esta notificação para cancelar.",
      action: (
        <ToastAction
          altText="Confirmar exclusão"
          onClick={async () => {
            try {
              t.update({ id: t.id, title: "Excluindo...", description: "Aguarde" } as any)
              await deleteProfessional(id)
              t.update({ id: t.id, title: "Profissional excluído", description: "Profissional removido com sucesso" } as any)
              await loadProfessionals()
              setTimeout(() => t.dismiss(), 1500)
            } catch (error) {
              t.update({
                id: t.id,
                title: "Erro ao excluir profissional",
                description: error instanceof Error ? error.message : "Tente novamente",
                variant: "destructive",
              } as any)
            }
          }}
        >
          Excluir
        </ToastAction>
      ),
    })
  }

  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch =
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professional.specialty && professional.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "all" || professional.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Profissionais</h2>
          <p className="text-muted-foreground mt-1">Gerencie os profissionais do seu negócio</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({ name: "", specialty: "", email: "", phone: "", work_days: "", notes: "" })
            setShowForm(!showForm)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Novo Profissional
        </Button>
      </div>

      <PlanLimitBanner
        currentCount={professionals.length}
        limitType="professionals"
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {showForm && (
        <Card className="p-6 border border-border bg-gradient-to-br from-primary/5 to-secondary/5">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {editingId ? "Editar Profissional" : "Novo Profissional"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              placeholder="Nome Completo *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Especialidade"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="bg-background"
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Telefone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Dias de Trabalho"
              value={formData.work_days}
              onChange={(e) => setFormData({ ...formData, work_days: e.target.value })}
              className="bg-background"
            />
            <Input
              placeholder="Notas (opcional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-background"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddProfessional} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingId ? "Atualizando..." : "Salvando..."}
                </>
              ) : (
                editingId ? "Atualizar" : "Salvar"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
            Todos
          </Button>
          <Button variant={filterStatus === "active" ? "default" : "outline"} onClick={() => setFilterStatus("active")}>
            Ativos
          </Button>
          <Button
            variant={filterStatus === "inactive" ? "default" : "outline"}
            onClick={() => setFilterStatus("inactive")}
          >
            Inativos
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProfessionals.length > 0 ? (
          filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="p-4 sm:p-6 border border-border hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-lg">{professional.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {professional.specialty && (
                          <Badge className="bg-primary/10 text-primary border-0">{professional.specialty}</Badge>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            professional.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {professional.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    {professional.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {professional.email}
                      </div>
                    )}
                    {professional.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {professional.phone}
                      </div>
                    )}
                    {professional.work_days && (
                      <div className="text-sm text-muted-foreground">Dias: {professional.work_days}</div>
                    )}
                  </div>

                  {professional.notes && (
                    <p className="text-sm text-muted-foreground italic">Notas: {professional.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProfessional(professional)}
                    className="flex-1 sm:flex-none"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProfessional(professional.id)}
                    className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 border border-border text-center">
            <p className="text-muted-foreground">Nenhum profissional encontrado</p>
            <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Profissional
            </Button>
          </Card>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        limitType="professionals"
        currentCount={professionals.length}
      />
    </div>
  )
}
