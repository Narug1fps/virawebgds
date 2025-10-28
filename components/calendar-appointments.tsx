"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "@/app/actions/appointments"
import { getPatients } from "@/app/actions/patients"
import { getProfessionals } from "@/app/actions/professionals"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
  id: string
  user_id: string
  patient_id: string
  professional_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export default function CalendarAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([])
  const [professionals, setProfessionals] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProfessional, setSelectedProfessional] = useState<string | "all">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    patient_id: "",
    professional_id: "",
    appointment_date: "",
    appointment_time: "",
    duration_minutes: 60,
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [appointmentsData, patientsData, professionalsData] = await Promise.all([
        getAppointments(),
        getPatients(),
        getProfessionals(),
      ])
      setAppointments(appointmentsData)
      setPatients(patientsData.map((p) => ({ id: p.id, name: p.name })))
      setProfessionals(professionalsData.map((p) => ({ id: p.id, name: p.name })))
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((apt) => {
      if (apt.appointment_date !== dateStr) return false
      if (selectedProfessional === "all") return true
      return apt.professional_id === selectedProfessional
    })
  }

  const selectedDateAppointments = getAppointmentsForDate(selectedDate)

  const calendarDays = []
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(dateStr)
  }

  const handleAddAppointment = async () => {
    if (formData.patient_id && formData.professional_id && formData.appointment_date && formData.appointment_time) {
      try {
        setIsSaving(true)
        if (editingId) {
          const updated = await updateAppointment(editingId, formData)
          setAppointments(appointments.map((a) => (a.id === editingId ? updated : a)))
          toast({
            title: "Agendamento atualizado",
            description: "O agendamento foi atualizado com sucesso",
          })
        } else {
          const newAppointment = await createAppointment(formData)
          setAppointments([...appointments, newAppointment])
          toast({
            title: "Agendamento criado",
            description: "O agendamento foi criado com sucesso",
          })
        }
        setFormData({
          patient_id: "",
          professional_id: "",
          appointment_date: "",
          appointment_time: "",
          duration_minutes: 60,
          notes: "",
        })
        setEditingId(null)
        setShowForm(false)
      } catch (error) {
        toast({
          title: "Erro ao salvar agendamento",
          description: error instanceof Error ? error.message : "Tente novamente",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setFormData({
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_minutes: appointment.duration_minutes,
      notes: appointment.notes || "",
    })
    setEditingId(appointment.id)
    setShowForm(true)
  }

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id)
      setAppointments(appointments.filter((a) => a.id !== id))
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir agendamento",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus)
      setAppointments(appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-700 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.name || "Cliente não encontrado"
  }

  const getProfessionalName = (professionalId: string) => {
    return professionals.find((p) => p.id === professionalId)?.name || "Profissional não encontrado"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground mt-1">Visualize e gerencie agendamentos por calendário</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({
              patient_id: "",
              professional_id: "",
              appointment_date: selectedDate,
              appointment_time: "",
              duration_minutes: 60,
              notes: "",
            })
            setShowForm(!showForm)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 border border-border bg-gradient-to-br from-primary/5 to-secondary/5">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {editingId ? "Editar Agendamento" : "Novo Agendamento"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um cliente</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
            <select
              value={formData.professional_id}
              onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione um profissional</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              className="bg-background"
            />
            <Input
              type="time"
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              className="bg-background"
            />
            <Input
              type="number"
              placeholder="Duração (minutos)"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: Number.parseInt(e.target.value) || 60 })}
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
            <Button
              onClick={handleAddAppointment}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingId ? (
                "Atualizar"
              ) : (
                "Salvar"
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

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1 p-6 border border-border">
          {/* Professional filter on top */}
          

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-bold text-foreground">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <p className="text-xs text-muted-foreground">Selecione um dia para ver agendamentos</p>
              </div>

              {/* Professional filter beside month name (hidden on very small screens) */}
              <div className="hidden sm:block">
                <div className="w-50">
                  <Select value={selectedProfessional} onValueChange={(v) => setSelectedProfessional(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Geral (todos profissionais)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Geral (todos profissionais)</SelectItem>
                      {professionals.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="cursor-pointer">{p.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div />
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-3">
            {calendarDays.map((day, index) => {
              const dateStr = day ? formatDate(currentDate.getFullYear(), currentDate.getMonth(), day) : null
              const dayAppointments = dateStr ? getAppointmentsForDate(dateStr) : []
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === new Date().toISOString().split("T")[0]

              if (!day) {
                return <div key={index} className="w-10 h-10" />
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`w-10 h-10 flex flex-col cursor-pointer items-center justify-center text-sm font-medium transition-all relative ${
                    isSelected
                      ? "bg-primary text-primary-foreground rounded-full shadow-lg"
                      : "bg-background rounded-md border border-border hover:bg-primary/5"
                  }`}
                >
                  <span className="leading-none">{day}</span>

                  {/* Today indicator (small dot) */}
                  {isToday && !isSelected && (
                    <span className="absolute -top-2 -right-2 w-2 h-2 rounded-full ring-2 ring-primary/40 bg-primary" />
                  )}

                  {/* Appointment count under the number; hide when the day is selected */}
                  {dayAppointments.length > 0 && !isSelected && (
                    <span className="mt-1 text-[11px] text-primary">{dayAppointments.length} </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Month navigation below the calendar */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="p-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth} className="p-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Appointments for selected date */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">
              Agendamentos de {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR")}
            </h3>

            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAppointments
                  .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                  .map((appointment) => (
                    <Card key={appointment.id} className="p-4 border border-border hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-foreground">{getPatientName(appointment.patient_id)}</h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(appointment.status)}`}
                            >
                              {getStatusIcon(appointment.status)}
                              {appointment.status === "scheduled" && "Agendado"}
                              {appointment.status === "completed" && "Concluído"}
                              {appointment.status === "cancelled" && "Cancelado"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {appointment.appointment_time} - {getProfessionalName(appointment.professional_id)} (
                            {appointment.duration_minutes} min)
                          </p>
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground italic">{appointment.notes}</p>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAppointment(appointment)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                          {appointment.status === "scheduled" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(appointment.id, "completed")}
                              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                            >
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="p-8 border border-border text-center">
                <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
