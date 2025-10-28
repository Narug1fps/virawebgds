"use server"

import { createClient } from "@/lib/supabase/server"

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

export async function getRecentPayments(limit = 10) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("payments")
    .select(`*, patients (name)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching payments:", error)
    return []
  }

  return data as Payment[]
}

export async function recordPayment(payload: {
  patient_id?: string | null
  appointment_id?: string | null
  amount: number
  discount?: number
  currency?: string
  status?: "paid" | "pending" | "overdue" | "refunded"
  payment_date?: string
  due_date?: string
  notes?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        user_id: user.id,
        patient_id: payload.patient_id || null,
        appointment_id: payload.appointment_id || null,
        amount: payload.amount,
        discount: payload.discount || 0,
        currency: payload.currency || "BRL",
        status: payload.status || "paid",
        payment_date: payload.payment_date || new Date().toISOString(),
        due_date: payload.due_date || null,
        notes: payload.notes || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error recording payment:", error)
    throw new Error("Failed to record payment")
  }

  // After successfully recording a payment, update any active financial goals
  try {
    const amountNet = Number((payload.amount || 0) - (payload.discount || 0))
    if (amountNet && amountNet > 0) {
      const { data: goals } = await supabase
        .from("goals")
        .select("id, current_value")
        .eq("user_id", user.id)
        .eq("category", "financeiro")
        .eq("status", "em_progresso")

      if (goals && goals.length > 0) {
        for (const g of goals) {
          const current = Number(g.current_value || 0)
          const newVal = current + amountNet
          // update each goal individually (simple, reliable approach)
          await supabase.from("goals").update({ current_value: newVal, updated_at: new Date().toISOString() }).eq("id", g.id)
        }
      }
    }
  } catch (err) {
    console.error("Error updating financial goals after payment:", err)
    // don't block payment recording if goals update fails
  }

  return data as Payment
}

export async function getFinancialSummary(period: "daily" | "weekly" | "monthly") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const now = new Date()
  let startDate = new Date()

  if (period === "daily") {
    startDate.setDate(now.getDate())
  } else if (period === "weekly") {
    startDate.setDate(now.getDate() - 7)
  } else {
    startDate.setMonth(now.getMonth() - 1)
  }

  const startISO = startDate.toISOString()

  // Fetch payments in period
  let payments: any[] | null = null
  try {
    const res = await supabase
      .from("payments")
      .select("amount, discount, status, payment_date")
      .eq("user_id", user.id)
      .gte("payment_date", startISO)

    if (res.error) {
      console.error("Error fetching payments summary:", res.error)
      // don't throw — return zeros to keep the dashboard stable
      return { totalReceived: 0, totalDiscounts: 0, totalPending: 0 }
    }

    payments = res.data as any[]
  } catch (err) {
    console.error("Unexpected error fetching payments summary:", err)
    return { totalReceived: 0, totalDiscounts: 0, totalPending: 0 }
  }

  let totalReceived = 0
  let totalDiscounts = 0
  let totalPending = 0

  ;(payments || []).forEach((p: any) => {
    const amt = Number(p.amount || 0)
    const disc = Number(p.discount || 0)
    if (p.status === "paid") totalReceived += amt
    if (disc) totalDiscounts += disc
    if (p.status === "pending" || p.status === "overdue") totalPending += amt - disc
  })

  return {
    totalReceived,
    totalDiscounts,
    totalPending,
  }
}

// Return time-series for charting. period: 'days' number of past days
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
    // return an array of zeros
    const zeros = [] as { date: string; value: number }[]
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      zeros.push({ date: d.toISOString().split("T")[0], value: 0 })
    }
    return zeros
  }

  const map: Record<string, number> = {}
  ;(payments || []).forEach((p: any) => {
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

export async function getPatientFinancialSummary(patientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  const [{ data: payments }, { data: sessions }] = await Promise.all([
    supabase.from("payments").select("amount,discount,status,payment_date").eq("user_id", user.id).eq("patient_id", patientId),
    supabase
      .from("financial_sessions")
      .select("unit_price,discount,paid")
      .eq("user_id", user.id)
      .eq("patient_id", patientId),
  ])

  let paid = 0
  let discounts = 0
  let due = 0

  ;(payments || []).forEach((p: any) => {
    if (p.status === "paid") paid += Number(p.amount || 0)
    if (p.discount) discounts += Number(p.discount || 0)
    if (p.status === "pending" || p.status === "overdue") due += Number(p.amount || 0) - Number(p.discount || 0)
  })

  ;(sessions || []).forEach((s: any) => {
    const price = Number(s.unit_price || 0)
    const disc = Number(s.discount || 0)
    if (s.paid) paid += price - disc
    else due += price - disc
    if (disc) discounts += disc
  })

  return {
    paid,
    due,
    discounts,
  }
}

export async function getOutstandingPatients() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) throw new Error("User not authenticated")

  // Find sessions not paid grouped by patient
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
  ;(data || []).forEach((s: any) => {
    const pid = s.patient_id || "unknown"
    const val = Number(s.unit_price || 0) - Number(s.discount || 0)
    map[pid] = (map[pid] || 0) + val
  })

  // Convert to array and fetch patient names
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

  return (patients || []).map((p: any) => ({ id: p.id, name: p.name, outstanding: map[p.id] || 0 }))
}
