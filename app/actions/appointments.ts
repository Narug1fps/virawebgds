"use server"

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "./notifications"
import { getUserSubscription } from "./subscription"
import { checkLimit } from "@/lib/usage-stats"

export interface Appointment {
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

export async function getAppointments() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", user.id)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  if (error) {
    console.error(" Error fetching appointments:", error)
    throw new Error("Failed to fetch appointments")
  }

  return data as Appointment[]
}

export async function createAppointment(appointmentData: {
  patient_id: string
  professional_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  notes?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const subscription = await getUserSubscription()
  const planType = (subscription?.plan_type?.toLowerCase() as "basic" | "premium" | "master") || "basic"

  const limitCheck = await checkLimit(planType, "appointmentsPerMonth")

  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Limite de agendamentos mensais atingido.")
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      ...appointmentData,
      notes: appointmentData.notes || null,
      status: "scheduled",
    })
    .select()
    .single()

  if (error) {
    console.error(" Error creating appointment:", error)
    throw new Error("Failed to create appointment")
  }

  await createNotification("Agendamento Criado", "Novo agendamento foi criado com sucesso.", "success")

  return data as Appointment
}

export async function updateAppointment(
  appointmentId: string,
  appointmentData: {
    patient_id: string
    professional_id: string
    appointment_date: string
    appointment_time: string
    duration_minutes: number
    notes?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      ...appointmentData,
      notes: appointmentData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error(" Error updating appointment:", error)
    throw new Error("Failed to update appointment")
  }

  await createNotification("Agendamento Atualizado", "Agendamento foi atualizado com sucesso.", "info")

  return data as Appointment
}

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId).eq("user_id", user.id)

  if (error) {
    console.error(" Error deleting appointment:", error)
    throw new Error("Failed to delete appointment")
  }

  await createNotification("Agendamento Cancelado", "Agendamento foi cancelado com sucesso.", "info")

  return { success: true }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("user_id", user.id)

  if (error) {
    console.error(" Error updating appointment status:", error)
    throw new Error("Failed to update appointment status")
  }

  // If appointment was completed, create a financial session row (if not exists)
  try {
    if (status === "completed") {
      // fetch appointment details to get date and patient
      const { data: appointment, error: apptErr } = await supabase
        .from("appointments")
        .select("id, patient_id, appointment_date")
        .eq("id", appointmentId)
        .eq("user_id", user.id)
        .single()

      if (!apptErr && appointment) {
        // avoid duplicate sessions for same appointment
        const { data: existing } = await supabase
          .from("financial_sessions")
          .select("id")
          .eq("appointment_id", appointmentId)
          .maybeSingle()

        if (!existing) {
          const defaultPrice = 100.0 // TODO: make configurable per patient/professional
          const { error: sessErr } = await supabase.from("financial_sessions").insert([
            {
              user_id: user.id,
              patient_id: appointment.patient_id || null,
              appointment_id: appointmentId,
              session_date: appointment.appointment_date,
              unit_price: defaultPrice,
              discount: 0,
              paid: false,
            },
          ])

          if (sessErr) {
            console.error("Error creating financial session:", sessErr)
          } else {
            await createNotification(
              "Sessão Registrada",
              `Sessão do dia ${new Date(appointment.appointment_date).toLocaleDateString("pt-BR")} registrada no financeiro.`,
              "info",
            )
          }
        }
      }
    }
  } catch (e) {
    console.error("Error while creating financial session:", e)
  }

  return { success: true }
}
