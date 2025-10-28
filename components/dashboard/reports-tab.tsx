"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { getDashboardStats, getAppointmentsByMonth, getPatientGrowth } from "@/app/actions/reports"

export default function ReportsTab() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalAppointments: 0, activePatients: 0, completionRate: 0 })
  const [appointmentData, setAppointmentData] = useState<any[]>([])
  const [patientData, setPatientData] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, appointmentsData, patientsData] = await Promise.all([
          getDashboardStats(),
          getAppointmentsByMonth(),
          getPatientGrowth(),
        ])

        setStats(statsData)
        setAppointmentData(appointmentsData)
        setPatientData(patientsData)
      } catch (error) {
        console.error("Error loading reports data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-foreground mb-6">Relatórios</h2>

      {/* Cards de resumo no estilo calendário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 shadow-sm p-6 items-start">
          <span className="text-xs text-muted-foreground mb-1">Total de Agendamentos</span>
          <span className="text-3xl font-bold text-foreground">{stats.totalAppointments}</span>
          <span className="text-xs text-muted-foreground mt-2">Todos os agendamentos</span>
        </div>
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 shadow-sm p-6 items-start">
          <span className="text-xs text-muted-foreground mb-1">Pacientes Ativos</span>
          <span className="text-3xl font-bold text-foreground">{stats.activePatients}</span>
          <span className="text-xs text-muted-foreground mt-2">Pacientes cadastrados</span>
        </div>
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 shadow-sm p-6 items-start">
          <span className="text-xs text-muted-foreground mb-1">Taxa de Conclusão</span>
          <span className="text-3xl font-bold text-foreground">{stats.completionRate}%</span>
          <span className="text-xs text-muted-foreground mt-2">{stats.completionRate >= 90 ? "Excelente desempenho" : "Bom desempenho"}</span>
        </div>
      </div>

      {/* Gráficos em cards arredondados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Agendamentos por Mês</h3>
          {appointmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#3396D3" name="Concluídos" />
                <Bar dataKey="cancelled" fill="#FF6B6B" name="Cancelados" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-border dark:border-slate-700 shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Crescimento de Pacientes</h3>
          {patientData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalPatients" stroke="#3396D3" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="newPatients" stroke="#FFD400" strokeWidth={2} name="Novos" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
