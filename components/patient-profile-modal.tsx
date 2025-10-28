"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, FileText, Calendar, MapPin, Save, Upload, Loader2 } from "lucide-react"
import { getPatientById, updatePatientNotes, updatePatientPhoto } from "@/app/actions/patients"
import { mapDbErrorToUserMessage } from "@/lib/error-messages"
import { getPatientFinancialSummary } from "@/app/actions/financial-actions"
import PaymentModal from "@/components/financial/payment-modal"
import { useToast } from "@/hooks/use-toast"
import type { Patient } from "@/app/actions/patients"

interface PatientProfileModalProps {
  patientId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export default function PatientProfileModal({ patientId, isOpen, onClose, onUpdate }: PatientProfileModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [financialSummary, setFinancialSummary] = useState<{ paid: number; due: number; discounts: number } | null>(
    null,
  )
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (patientId && isOpen) {
      loadPatient()
    }
  }, [patientId, isOpen])

  const loadPatient = async () => {
    if (!patientId) return

    setLoading(true)
    try {
      const data = await getPatientById(patientId)
      setPatient(data)
      setNotes(data.notes || "")
      try {
        const fin = await getPatientFinancialSummary(patientId)
        setFinancialSummary(fin)
      } catch (err) {
        console.error("Error loading patient financial summary:", err)
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar cliente",
        description: mapDbErrorToUserMessage(error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!patientId) return

    setSaving(true)
    try {
      await updatePatientNotes(patientId, notes)
      toast({
        title: "Notas salvas",
        description: "As notas do cliente foram atualizadas com sucesso",
      })
      if (onUpdate) onUpdate()
    } catch (error) {
      toast({
        title: "Erro ao salvar notas",
        description: mapDbErrorToUserMessage(error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!patientId || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Convert image to base64 for demo purposes
      // In production, you would upload to Supabase Storage or another service
      const reader = new FileReader()
      reader.onloadend = async () => {
        const photoUrl = reader.result as string
        await updatePatientPhoto(patientId, photoUrl)
        setPatient((prev) => (prev ? { ...prev, profile_photo_url: photoUrl } : null))
        toast({
          title: "Foto atualizada",
          description: "A foto do perfil foi atualizada com sucesso",
        })
        if (onUpdate) onUpdate()
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Erro ao fazer upload",
        description: mapDbErrorToUserMessage(error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const [showPaymentModal, setShowPaymentModal] = useState(false)

  if (!patient && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Perfil do Cliente</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={patient.profile_photo_url || undefined} alt={patient.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{patient.name}</h3>
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                      patient.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {patient.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                  {/* Show patient's total discounts (if available) */}
                  {financialSummary && (
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground block">Descontos acumulados</span>
                      <span className="inline-block text-sm font-semibold">R$ {financialSummary.discounts.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Patient Information */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-foreground mb-4">Informações do Cliente</h4>
              <div className="grid sm:grid-cols-2 gap-4 min-w-0">
                {patient.email && (
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground truncate">{patient.email}</p>
                    </div>
                  </div>
                )}

                {patient.phone && (
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium text-foreground">{patient.phone}</p>
                    </div>
                  </div>
                )}

                {patient.cpf && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CPF</p>
                      <p className="text-sm font-medium text-foreground">{patient.cpf}</p>
                    </div>
                  </div>
                )}

                {(patient.birthday || patient.date_of_birth) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                      <p className="text-sm font-medium text-foreground">
                        {(() => {
                          const raw = (patient.birthday || patient.date_of_birth) as string | undefined
                          try {
                            return raw ? new Date(raw).toLocaleDateString("pt-BR") : ""
                          } catch (e) {
                            return ""
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-sm font-medium text-foreground">{patient.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-foreground mb-4">Resumo Financeiro</h4>
              {financialSummary ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-xl font-bold text-foreground">R$ {financialSummary.paid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Devido</p>
                    <p className="text-xl font-bold text-foreground">R$ {financialSummary.due.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Descontos</p>
                    <p className="text-xl font-bold text-foreground">R$ {financialSummary.discounts.toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando resumo financeiro...</p>
              )}
              <div className="mt-4 flex gap-2 justify-end">
                <Button onClick={() => setShowPaymentModal(true)} className="bg-primary text-primary-foreground">
                  Registrar Pagamento
                </Button>
              </div>
            </Card>

            {/* Notes Section */}
            <Card className="p-6">
              <h4 className="text-lg font-bold text-foreground mb-4">Notas do Cliente</h4>
              <Textarea
                placeholder="Adicione notas sobre o cliente, histórico, observações, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[200px] mb-4"
              />
              <Button onClick={handleSaveNotes} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Notas
              </Button>
            </Card>
          </div>
        ) : null}
      </DialogContent>
      {/* Payment Modal (nested) */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={(open) => {
          setShowPaymentModal(open)
          if (!open) loadPatient()
        }}
        defaultPatientId={patientId}
        onSaved={() => {
          // reload financial summary after saving
          if (patientId) getPatientFinancialSummary(patientId).then((s) => setFinancialSummary(s)).catch(console.error)
        }}
      />
    </Dialog>
  )
}
