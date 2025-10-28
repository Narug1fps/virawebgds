"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPatients } from "@/app/actions/patients"
import { recordPayment } from "@/app/actions/financial-actions"
import { useToast } from "@/hooks/use-toast"


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  defaultPatientId?: string | null
}

export default function PaymentModal({ open, onOpenChange, onSaved, defaultPatientId = null }: Props) {
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([])
  const [patientId, setPatientId] = useState<string | null>(defaultPatientId)
  const [amount, setAmount] = useState<string>("")
  const [discount, setDiscount] = useState<string>("0")
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount')
  const [status, setStatus] = useState<string>("paid")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPatients()
        setPatients(data.map((p: any) => ({ id: p.id, name: p.name })))
      } catch (err) {
        console.error("Error loading patients for payment modal:", err)
      }
    }

    if (open) {
      load()
      // Set default patient if provided
      setPatientId(defaultPatientId || null)
    }
  }, [open, defaultPatientId])

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Valor inválido", description: "Informe um valor maior que zero." })
      return
    }

    // compute discount in reais
    const amountNumber = Number(amount)
    let discountReais = 0
    if (discountMode === 'percent') {
      const pct = Number(discount || 0)
      if (isNaN(pct) || pct < 0) {
        toast({ title: 'Desconto inválido', description: 'Informe uma porcentagem válida.' })
        return
      }
      discountReais = Math.round((amountNumber * (pct / 100)) * 100) / 100
    } else {
      discountReais = Math.round((Number(discount || 0) || 0) * 100) / 100
    }

    if (discountReais < 0 || discountReais > amountNumber) {
      toast({ title: 'Desconto inválido', description: 'O desconto deve ser entre 0 e o valor do pagamento.' })
      return
    }

    setLoading(true)
    try {
      await recordPayment({
        patient_id: patientId,
        amount: amountNumber,
        discount: discountReais,
        status: status as any,
        payment_date: new Date(date).toISOString(),
      })

      toast({ title: "Pagamento registrado", description: "Pagamento salvo com sucesso." })
      onOpenChange(false)
      if (onSaved) onSaved()
    } catch (err) {
      console.error("Error saving payment:", err)
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar o pagamento." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 mt-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Cliente (opcional)</label>
            <Select value={patientId ?? "none"} onValueChange={(v) => setPatientId(v === "none" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cliente</SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Valor (R$)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Desconto</label>
            <div className="flex items-center gap-2">
              <div className="w-28">
                <Select value={discountMode} onValueChange={(v) => setDiscountMode(v as 'amount' | 'percent')}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">R$</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder={discountMode === 'percent' ? '0' : '0.00'}
                inputMode={discountMode === 'percent' ? 'numeric' : 'decimal'}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Se selecionar %, o desconto será calculado em reais a partir do valor informado.</p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="refunded">Estornado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Data do Pagamento</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Pagamento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
