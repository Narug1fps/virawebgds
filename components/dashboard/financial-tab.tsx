"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, Clock, PieChart, Loader2 } from "lucide-react"
import {
  getFinancialSummary,
  getRecentPayments,
  getFinancialReport,
} from "@/app/actions/financial-actions"
import PaymentModal from "@/components/financial/payment-modal"

type Period = "daily" | "weekly" | "monthly"

export default function FinancialTab() {
  const [summary, setSummary] = useState({ totalReceived: 0, totalDiscounts: 0, totalPending: 0 })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  const [reportPeriod, setReportPeriod] = useState<Period>("monthly")
  const [reportLoading, setReportLoading] = useState(false)
  const [report, setReport] = useState<any[]>([])

  const loadSummary = async () => {
    try {
      const s = await getFinancialSummary("monthly")
      const recent = await getRecentPayments(10)
      setSummary(s)
      setRecentPayments(recent || [])
    } catch (err) {
      console.error("Error loading financial data:", err)
    }
  }

  const loadReport = async (p: Period) => {
    setReportLoading(true)
    try {
      const data = await getFinancialReport(p)
      setReport(data || [])
    } catch (err) {
      console.error("Error loading financial report:", err)
      setReport([])
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
    loadReport(reportPeriod)
  }, [])

  useEffect(() => {
    loadReport(reportPeriod)
  }, [reportPeriod])

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 border border-border min-h-[96px]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recebido (mês)</p>
              <p className="text-2xl font-bold text-foreground">R$ {Number(summary.totalReceived || 0).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border min-h-[96px]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-foreground">R$ {Number(summary.totalPending || 0).toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border min-h-[96px]">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-pink-100 text-pink-700">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descontos</p>
              <p className="text-2xl font-bold text-foreground">R$ {Number(summary.totalDiscounts || 0).toFixed(2)}</p>
            </div>
          </div>
        </Card>
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

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Relatório</h3>
          <div className="flex items-center gap-2">
            <Button variant={reportPeriod === "daily" ? "default" : "ghost"} size="sm" onClick={() => setReportPeriod("daily")}>Diário</Button>
            <Button variant={reportPeriod === "weekly" ? "default" : "ghost"} size="sm" onClick={() => setReportPeriod("weekly")}>Semanal</Button>
            <Button variant={reportPeriod === "monthly" ? "default" : "ghost"} size="sm" onClick={() => setReportPeriod("monthly")}>Mensal</Button>
          </div>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {report.length === 0 ? (
              <p className="text-muted-foreground">Nenhum dado para o período selecionado.</p>
            ) : (
              report.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    {r.date && <div className="font-medium">{r.date}</div>}
                    {r.weekStart && <div className="text-sm text-muted-foreground">Semana: {r.weekStart}</div>}
                    {r.month && <div className="text-sm text-muted-foreground">Mês: {r.month}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-lg font-semibold">R$ {(r.total || r.value || 0).toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      <PaymentModal
        open={showModal}
        onOpenChange={setShowModal}
        onSaved={async () => {
          try {
            await loadSummary()
            await loadReport(reportPeriod)
          } catch (err) {
            console.error("Error reloading after save:", err)
          }
        }}
      />
    </div>
  )
}
