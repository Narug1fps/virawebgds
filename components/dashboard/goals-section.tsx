"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, TrendingUp, Calendar, Edit, Trash2, CheckCircle2, Loader2 } from "lucide-react"
import { getGoals, createGoal, updateGoal, deleteGoal, type Goal } from "@/app/actions/goals"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { formatDateString } from "@/lib/utils"

export function GoalsSection() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_value: "",
    current_value: "",
    unit: "",
    deadline: "",
    category: "",
  })

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      const data = await getGoals()
      setGoals(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      target_value: "",
      current_value: "",
      unit: "",
      deadline: "",
      category: "",
    })
    setEditingGoal(null)
  }

  function handleEdit(goal: Goal) {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || "",
      target_value: goal.target_value?.toString() || "",
      current_value: goal.current_value?.toString() || "",
      unit: goal.unit || "",
      deadline: goal.deadline || "",
      category: goal.category || "",
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const goalData = {
        title: formData.title,
        description: formData.description || undefined,
        target_value: formData.target_value ? Number.parseFloat(formData.target_value) : undefined,
        current_value: formData.current_value ? Number.parseFloat(formData.current_value) : 0,
        unit: formData.unit || undefined,
        deadline: formData.deadline || undefined,
        category: formData.category || undefined,
      }

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData)
        toast({
          title: "Meta atualizada!",
          description: "Sua meta foi atualizada com sucesso.",
        })
      } else {
        await createGoal(goalData)
        toast({
          title: "Meta criada!",
          description: "Sua meta foi criada com sucesso.",
        })
      }

      await loadGoals()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(goalId: string) {
    const t = toast({
      title: "Confirmar exclusão?",
      description: "Clique em Excluir para confirmar ou feche esta notificação para cancelar.",
      action: (
        <ToastAction
          altText="Confirmar exclusão"
          onClick={async () => {
            try {
              t.update({ id: t.id, title: "Excluindo...", description: "Aguarde" } as any)
              await deleteGoal(goalId)
              t.update({ id: t.id, title: "Meta excluída", description: "A meta foi removida com sucesso." } as any)
              await loadGoals()
              setTimeout(() => t.dismiss(), 1500)
            } catch (error) {
              t.update({
                id: t.id,
                title: "Erro",
                description: "Não foi possível excluir a meta",
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

  async function handleComplete(goal: Goal) {
    try {
      await updateGoal(goal.id, { status: "concluida" })
      toast({
        title: "Parabéns! 🎉",
        description: "Meta concluída com sucesso!",
      })
      await loadGoals()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a meta",
        variant: "destructive",
      })
    }
  }

  async function createAppointmentGoal() {
    setLoading(true)
    try {
      await createGoal({
        title: "Meta de Agendamentos",
        description: "Meta automática de agendamentos",
        target_value: 100,
        current_value: 0,
        unit: "agendamentos",
        category: "agendamentos",
      })

      toast({
        title: "Meta criada",
        description: "Meta de agendamentos criada com sucesso.",
      })

      await loadGoals()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a meta automática",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function getProgressPercentage(goal: Goal) {
    if (!goal.target_value || goal.target_value === 0) return 0
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
  }

  function getCategoryColor(category?: string) {
    switch (category) {
      case "financeiro":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "clientes":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "profissionais":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const activeGoals = goals.filter((g) => g.status === "em_progresso")
  const completedGoals = goals.filter((g) => g.status === "concluida")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minhas Metas</h2>
          <p className="text-muted-foreground">Defina e acompanhe seus objetivos</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <div className="flex items-center gap-2">
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>

          </div>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Editar Meta" : "Criar Nova Meta"}</DialogTitle>
              <DialogDescription>Defina uma meta para acompanhar seu progresso</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Meta *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Atender 100 clientes este mês"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva sua meta em detalhes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="clientes">Clientes</SelectItem>
                        <SelectItem value="agendamentos">Agendamentos</SelectItem>
                        <SelectItem value="profissionais">Profissionais</SelectItem>
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Valor Alvo</Label>
                  <Input
                    id="target_value"
                    type="number"
                    placeholder="100"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_value">Valor Atual</Label>
                  <Input
                    id="current_value"
                    type="number"
                    placeholder="0"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    placeholder="clientes"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingGoal ? "Atualizando..." : "Salvando..."}
                    </>
                  ) : (
                    editingGoal ? "Atualizar" : "Criar Meta"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">Em progresso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">Alcançadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">De todas as metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {loading && goals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando metas...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta criada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece definindo suas primeiras metas para acompanhar seu progresso
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal)
            const isCompleted = goal.status === "concluida"

            return (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isCompleted ? "opacity-75" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        {isCompleted && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Concluída
                          </Badge>
                        )}
                      </div>
                      {goal.description && (
                        <CardDescription className="line-clamp-2">{goal.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleComplete(goal)}
                          title="Marcar como concluída"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goal.target_value && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {goal.current_value} / {goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {goal.category && (
                        <Badge variant="outline" className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                      )}
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateString(goal.deadline)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
