"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Clock, PieChart } from "lucide-react"
import { getFinancialSummary, getRecentPayments } from "@/app/actions/financial-actions"
import FinancialChart from "./financial-chart"
import PaymentModal from "@/components/financial/payment-modal"

export default function FinancialTab() {
  const [summary, setSummary] = useState({ totalReceived: 0, totalDiscounts: 0, totalPending: 0 })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getFinancialSummary("monthly")
        const recent = await getRecentPayments(10)
        setSummary(s)
        setRecentPayments(recent || [])
      } catch (err) {
        console.error("Error loading financial data:", err)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <FinancialChart days={30} />
        </div>

        <div className="flex flex-col gap-4 sm:col-span-1">
          <Card className="p-6 border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recebido (mês)</p>
              <p className="text-2xl font-bold text-foreground">R$ {summary.totalReceived.toFixed(2)}</p>
            </div>
          </div>
        </Card>
          <Card className="p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">R$ {summary.totalPending.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-pink-100 text-pink-700">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descontos</p>
                <p className="text-2xl font-bold text-foreground">R$ {summary.totalDiscounts.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Pagamentos Recentes</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground">Registrar</Button>
              <Button size="sm">Ver todos</Button>
            </div>
        </div>

        <div className="space-y-2">
          {recentPayments.length > 0 ? (
            recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">{p.patients?.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">R$ {Number(p.amount).toFixed(2)} • {p.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">Nenhum pagamento registrado</div>
          )}
        </div>
      </Card>
      <PaymentModal open={showModal} onOpenChange={setShowModal} onSaved={async () => {
        try {
          const s = await getFinancialSummary("monthly")
          const recent = await getRecentPayments(10)
          setSummary(s)
          setRecentPayments(recent || [])
        } catch (err) {
          console.error("Error reloading after save:", err)
        }
      }} />
    </div>
  )
}
