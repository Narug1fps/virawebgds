"use server"

import { createClient } from "@/lib/supabase/server"
import { mapDbErrorToUserMessage } from "@/lib/error-messages"
import { revalidatePath } from "next/cache"

export interface Payment {
  id: string
  user_id: string
  patient_id: string | null
  appointment_id: string | null
  amount: number
  discount: number
  currency: string
  status: string
  payment_date: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SessionRow {
  id: string
  user_id: string
  patient_id: string | null
  appointment_id: string | null
  session_date: string
  unit_price: number
  discount: number
  paid: boolean
  payment_id: string | null
}

// ✅ LISTA DE PAGAMENTOS RECENTES
export async function getRecentPayments(limit = 10) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("payments")
    .select("*, patients (name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching payments:", error)
    return []
  }

  return data as Payment[]
}

// ✅ REGISTRA UM PAGAMENTO
export async function recordPayment(payload: {
  patient_id?: string | null
  appointment_id?: string | null
  amount: number | string
  discount?: number
  currency?: string
  status?: "paid" | "pending" | "overdue" | "refunded"
  payment_date?: string
  due_date?: string
  notes?: string
  // recurrence support (optional)
  is_recurring?: boolean
  recurrence_unit?: "daily" | "weekly" | "monthly"
  recurrence_interval?: number
  recurrence_end_date?: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("User not authenticated")

  const amountNum = Number((payload.amount || "0").toString().replace(",", ".").trim())
  const discountNum = Number(payload.discount || 0)
  if (isNaN(amountNum)) throw new Error("Invalid amount value")

  console.log("💰 Registrando pagamento:", {
    user_id: user.id,
    amount: amountNum,
    discount: discountNum,
    patient_id: payload.patient_id,
  })

  // Insert the payment and explicitly select only payments columns.
  // Some PostgREST setups may try to expand related fields (eg. patient columns)
  // and fail if the target DB doesn't have optional columns (eg. birthday).
  // Selecting explicit columns avoids that and prevents PGRST204-like errors.
  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        user_id: user.id,
        patient_id: payload.patient_id || null,
        appointment_id: payload.appointment_id || null,
        amount: amountNum,
        discount: discountNum,
        currency: payload.currency || "BRL",
        status: payload.status || "paid",
        payment_date: payload.payment_date || new Date().toISOString(),
        due_date: payload.due_date || null,
        is_recurring: payload.is_recurring || false,
        recurrence_unit: payload.recurrence_unit || null,
        recurrence_interval: payload.recurrence_interval || null,
        recurrence_end_date: payload.recurrence_end_date || null,
        notes: payload.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    // avoid returning related/expanded fields that may reference missing columns
    .select(
      "id, user_id, patient_id, appointment_id, amount, discount, currency, status, payment_date, due_date, notes, created_at, updated_at"
    )
    .single()

  if (error) {
    console.error("❌ Error recording payment:", error)
    const parts = [error.message, (error as any).details, (error as any).hint, (error as any).code].filter(Boolean).map(String)
    const full = parts.join(" | ") || "Failed to record payment"
    const friendly = mapDbErrorToUserMessage(full)
    throw new Error(friendly)
  }

  console.log("✅ Payment recorded successfully:", data)
  // Atualiza metas financeiras (incrementa metas da categoria "financeiro")
  try {
    const amountNet = amountNum - discountNum
    if (amountNet > 0) {
      const { data: goals, error: goalsError } = await supabase
        .from("goals")
        .select("id, current_value")
        .eq("user_id", user.id)
        .eq("category", "financeiro")
        .eq("status", "em_progresso")

      if (!goalsError && goals && goals.length > 0) {
        await Promise.all(
          goals.map((g: any) => {
            const newVal = (Number(g.current_value) || 0) + amountNet
            return supabase.from("goals").update({ current_value: newVal, updated_at: new Date().toISOString() }).eq("id", g.id)
          })
        )
        // revalidate dashboard so goals section updates
        try {
          revalidatePath("/dashboard")
        } catch (e) {
          // ignore revalidation errors in serverless
        }
      }
    }
  } catch (e) {
    console.error("Error updating goals after payment:", e)
  }

  return data as Payment
}


// ✅ RESUMO FINANCEIRO (DIÁRIO, SEMANAL, MENSAL)
export async function getFinancialSummary(period: "daily" | "weekly" | "monthly") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const now = new Date()
  const startDate = new Date()

  if (period === "daily") {
    startDate.setHours(0, 0, 0, 0)
  } else if (period === "weekly") {
    startDate.setDate(now.getDate() - 7)
  } else {
    startDate.setMonth(now.getMonth() - 1)
  }

  const startISO = startDate.toISOString()

  const { data, error } = await supabase
    .from("payments")
    .select("amount, discount, status, payment_date")
    .eq("user_id", user.id)
    .gte("payment_date", startISO)

  if (error) {
    console.error("Error fetching payments summary:", error)
    return { totalReceived: 0, totalDiscounts: 0, totalPending: 0 }
  }

  let totalReceived = 0
  let totalDiscounts = 0
  let totalPending = 0

  data?.forEach((p: any) => {
    const amt = Number(p.amount || 0)
    const disc = Number(p.discount || 0)
    if (p.status === "paid") totalReceived += amt
    if (disc) totalDiscounts += disc
    if (p.status === "pending" || p.status === "overdue") totalPending += amt - disc
  })

  return { totalReceived, totalDiscounts, totalPending }
}

// ✅ SÉRIE TEMPORAL (GRÁFICO FINANCEIRO)
export async function getFinancialSeries(days = 30) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const startISO = start.toISOString()

  const { data: payments, error } = await supabase
    .from("payments")
    .select("amount, discount, payment_date")
    .eq("user_id", user.id)
    .gte("payment_date", startISO)

  if (error) {
    console.error("Error fetching payments for series:", error)
    const zeros: { date: string; value: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      zeros.push({ date: d.toISOString().split("T")[0], value: 0 })
    }
    return zeros
  }

  const map: Record<string, number> = {}
  payments?.forEach((p: any) => {
    const date = p.payment_date ? new Date(p.payment_date).toISOString().split("T")[0] : null
    if (!date) return
    const amt = Number(p.amount || 0) - Number(p.discount || 0)
    map[date] = (map[date] || 0) + amt
  })

  const series: { date: string; value: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().split("T")[0]
    series.push({ date: key, value: Number((map[key] || 0).toFixed(2)) })
  }

  return series
}

// Relatório financeiro: retorno agrupado por dia/semana/mês
export async function getFinancialReport(period: "daily" | "weekly" | "monthly") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  if (period === "daily") {
    // last 7 days, grouped by date
    const start = new Date()
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from("payments")
      .select("amount, discount, payment_date")
      .eq("user_id", user.id)
      .gte("payment_date", start.toISOString())

    if (error) {
      console.error("Error fetching daily report:", error)
      return []
    }

    const map: Record<string, number> = {}
    data?.forEach((p: any) => {
      const date = p.payment_date ? new Date(p.payment_date).toISOString().split("T")[0] : null
      if (!date) return
      const amt = Number(p.amount || 0) - Number(p.discount || 0)
      map[date] = (map[date] || 0) + amt
    })

    const out: { date: string; total: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().split("T")[0]
      out.push({ date: key, total: Number((map[key] || 0).toFixed(2)) })
    }
    return out
  }

  if (period === "weekly") {
    // last 12 weeks, grouped by week start
    const weeks = 12
    const start = new Date()
    start.setDate(start.getDate() - (weeks * 7 - 1))
    start.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from("payments")
      .select("amount, discount, payment_date")
      .eq("user_id", user.id)
      .gte("payment_date", start.toISOString())

    if (error) {
      console.error("Error fetching weekly report:", error)
      return []
    }

    const map: Record<string, number> = {}
    data?.forEach((p: any) => {
      if (!p.payment_date) return
      const dt = new Date(p.payment_date)
      // ISO week bucket by monday
      const monday = new Date(dt)
      const day = monday.getDay()
      const diff = (day + 6) % 7 // shift so monday=0
      monday.setDate(monday.getDate() - diff)
      const key = monday.toISOString().split("T")[0]
      const amt = Number(p.amount || 0) - Number(p.discount || 0)
      map[key] = (map[key] || 0) + amt
    })

    const out: { weekStart: string; total: number }[] = []
    for (let i = 0; i < weeks; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (weeks * 7 - 7) + i * 7)
      const monday = new Date(d)
      const day = monday.getDay()
      const diff = (day + 6) % 7
      monday.setDate(monday.getDate() - diff)
      const key = monday.toISOString().split("T")[0]
      out.push({ weekStart: key, total: Number((map[key] || 0).toFixed(2)) })
    }
    return out
  }

  // monthly
  // last 12 months
  const months = 12
  const start = new Date()
  start.setMonth(start.getMonth() - (months - 1))
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from("payments")
    .select("amount, discount, payment_date")
    .eq("user_id", user.id)
    .gte("payment_date", start.toISOString())

  if (error) {
    console.error("Error fetching monthly report:", error)
    return []
  }

  const map: Record<string, number> = {}
  data?.forEach((p: any) => {
    if (!p.payment_date) return
    const dt = new Date(p.payment_date)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
    const amt = Number(p.amount || 0) - Number(p.discount || 0)
    map[key] = (map[key] || 0) + amt
  })

  const out: { month: string; total: number }[] = []
  for (let i = 0; i < months; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - (months - 1 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push({ month: key, total: Number((map[key] || 0).toFixed(2)) })
  }

  return out
}

// ✅ RESUMO FINANCEIRO POR PACIENTE
export async function getPatientFinancialSummary(patientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const [{ data: payments }, { data: sessions }] = await Promise.all([
    supabase.from("payments").select("amount,discount,status,payment_date").eq("user_id", user.id).eq("patient_id", patientId),
    supabase.from("financial_sessions").select("unit_price,discount,paid").eq("user_id", user.id).eq("patient_id", patientId),
  ])

  let paid = 0
  let discounts = 0
  let due = 0

  payments?.forEach((p: any) => {
    if (p.status === "paid") paid += Number(p.amount || 0)
    if (p.discount) discounts += Number(p.discount || 0)
    if (p.status === "pending" || p.status === "overdue") due += Number(p.amount || 0) - Number(p.discount || 0)
  })

  sessions?.forEach((s: any) => {
    const price = Number(s.unit_price || 0)
    const disc = Number(s.discount || 0)
    if (s.paid) paid += price - disc
    else due += price - disc
    if (disc) discounts += disc
  })

  return { paid, due, discounts }
}

// ✅ LISTA DE PACIENTES COM DÉBITOS
export async function getOutstandingPatients() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("financial_sessions")
    .select("patient_id, unit_price, discount")
    .eq("user_id", user.id)
    .eq("paid", false)

  if (error) {
    console.error("Error fetching outstanding sessions:", error)
    return []
  }

  const map: Record<string, number> = {}
  data?.forEach((s: any) => {
    const pid = s.patient_id || "unknown"
    const val = Number(s.unit_price || 0) - Number(s.discount || 0)
    map[pid] = (map[pid] || 0) + val
  })

  const patientIds = Object.keys(map).filter((id) => id !== "unknown")
  if (patientIds.length === 0) return []

  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, name, phone")
    .in("id", patientIds)

  if (patientsError) {
    console.error("Error fetching patients for outstanding list:", patientsError)
    return []
  }

  return (patients || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    outstanding: map[p.id] || 0,
  }))
}
