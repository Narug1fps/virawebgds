"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPatients } from "@/app/actions/patients"
import { recordPayment, getPendingPaymentsForPatient, markPendingPaymentAsPaid } from "@/app/actions/financial-actions"
import { useToast } from "@/hooks/use-toast"
import { mapDbErrorToUserMessage } from "@/lib/error-messages"


interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  defaultPatientId?: string | null
  initialSettlePending?: boolean
  initialPendingPaymentId?: string | null
}

export default function PaymentModal({ open, onOpenChange, onSaved, defaultPatientId = null, initialSettlePending = false, initialPendingPaymentId = null }: Props) {
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([])
  const [patientId, setPatientId] = useState<string | null>(defaultPatientId)
  const [amount, setAmount] = useState<string>("")
  const [discount, setDiscount] = useState<string>("0")
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount')
  const [status, setStatus] = useState<string>("paid")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [pendingPayments, setPendingPayments] = useState<Array<any>>([])
  const [settlePending, setSettlePending] = useState(false)
  const [selectedPendingPayment, setSelectedPendingPayment] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  // recurrence simplified: only allow monthly recurrence on a given day
  const [recurrenceDay, setRecurrenceDay] = useState<number>(Number(new Date().toISOString().slice(8, 10)) || 1)
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
      // Apply initial settle flags if provided by parent
      setSettlePending(Boolean(initialSettlePending))
      setSelectedPendingPayment(initialPendingPaymentId || null)
      if (initialSettlePending) setStatus('paid')
    }
  }, [open, defaultPatientId])

  // Quando o paciente selecionado mudar, carregamos pagamentos pendentes
  useEffect(() => {
    if (!patientId) {
      setPendingPayments([])
      setSelectedPendingPayment(null)
      return
    }

    let mounted = true
    const loadPending = async () => {
      try {
        const data = await getPendingPaymentsForPatient(patientId)
        if (mounted) setPendingPayments(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error loading pending payments:', err)
      }
    }

    loadPending()
    return () => { mounted = false }
  }, [patientId])

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
      const created = await recordPayment({
        patient_id: patientId,
        amount: amountNumber,
        discount: discountReais,
        status: status as any,
        payment_date: new Date(date).toISOString(),
        is_recurring: isRecurring,
        // simplified recurring model: monthly on the chosen day
        recurrence_unit: isRecurring ? 'monthly' : undefined,
        recurrence_interval: isRecurring ? 1 : undefined,
        // no recurrence_end_date for now (infinite until user cancels)
        recurrence_end_date: undefined,
      })

      // Se o usuário marcou que este pagamento quita um pendente, atualizamos o pendente
      if (settlePending && selectedPendingPayment) {
        try {
          // created may be undefined in some fallback cases; use provided date as fallback
          const paidAt = (created && (created as any).payment_date) || new Date(date).toISOString()
          await markPendingPaymentAsPaid(selectedPendingPayment, paidAt)
        } catch (err) {
          console.error('Erro ao marcar pendente como pago:', err)
          // Não impedimos o fluxo de sucesso do novo pagamento, apenas avisamos
          toast({ title: 'Aviso', description: 'Pagamento salvo, mas falhou ao quitar o pendente selecionado.', variant: 'destructive' })
        }
      }

      toast({ title: "Pagamento registrado", description: "Pagamento salvo com sucesso." })
      onOpenChange(false)
      if (onSaved) onSaved()
    } catch (err) {
      console.error("Error saving payment:", err)
      const raw = err instanceof Error ? err.message : String(err)
      const friendly = mapDbErrorToUserMessage(raw)
      // In development show the raw server/db message too to help debugging.
      const description = process.env.NODE_ENV !== "production" ? `${friendly}\n\n[DEBUG] ${raw}` : friendly
      toast({ title: "Erro ao salvar", description, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg bg-popover dark:bg-slate-900">
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
            {/* Mostrar nome do cliente selecionado para confirmação */}
            {patientId && (
              (() => {
                const sel = patients.find((p) => p.id === patientId)
                return sel ? (
                  <p className="text-sm text-muted-foreground mt-2">Cliente selecionado: <span className="font-medium text-foreground">{sel.name}</span></p>
                ) : null
              })()
            )}
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

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Recorrência</label>
            <div className="flex items-center gap-2">
              <input id="is-recurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
              <label htmlFor="is-recurring" className="text-sm">Recorrente</label>
            </div>
            {isRecurring && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <p className="text-xs text-muted-foreground">A cobrança será gerada mensalmente no dia selecionado.</p>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Dia do pagamento</label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={String(recurrenceDay)}
                    onChange={(e) => setRecurrenceDay(Math.max(1, Math.min(28, Number(e.target.value) || 1)))}
                    className="w-24"
                  />
                </div>
              </div>
            )}
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
