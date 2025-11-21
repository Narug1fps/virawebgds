"use server"

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "./notifications"
import { getUserSubscription } from "./subscription"
import { checkLimit } from "@/lib/usage-stats"
import { updateGoalsForAction } from "./update-goals"

export interface Patient {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  cpf: string | null
  date_of_birth: string | null
  birthday: string | null
  address: string | null
  notes: string | null
  profile_photo_url: string | null
  status: "active" | "inactive"
  payment_status: string | null
  last_payment_date: string | null
  payment_due_date: string | null
  created_at: string
  updated_at: string
}

export async function getPatients() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching patients:", error)
    throw new Error("Failed to fetch patients")
  }

  return data as Patient[]
}

export async function getPatientById(patientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("Error fetching patient:", error)
    throw new Error("Failed to fetch patient")
  }

  return data as Patient
}

export async function createPatient(patientData: {
  name: string
  email: string
  phone: string
  cpf?: string
  date_of_birth?: string
  birthday?: string
  address?: string
  notes?: string
  profile_photo_url?: string
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

  const limitCheck = await checkLimit(planType, "patients")

  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Limite de clientes atingido.")
  }

  // normalize payload: don't insert empty cpf (use null) to avoid unique/constraint issues
  const insertPayload: any = {
    user_id: user.id,
    name: patientData.name,
    email: patientData.email || null,
    phone: patientData.phone || null,
    cpf: patientData.cpf && patientData.cpf.trim() !== "" ? patientData.cpf.trim() : null,
    date_of_birth: patientData.date_of_birth || null,
    address: patientData.address || null,
    notes: patientData.notes || null,
    profile_photo_url: patientData.profile_photo_url || null,
    status: "active",
  }

  const { data, error } = await supabase.from("patients").insert(insertPayload).select().single()

  if (error) {
    console.error(" Error creating patient:", error)
    // Build a detailed error message to return to the client for debugging
    const parts = [error.message, (error as any).details, (error as any).hint, (error as any).code]
      .filter(Boolean)
      .map(String)
    const fullMessage = parts.join(" | ") || "Failed to create patient"

    // If the DB is missing the `birthday` column (PGRST204), give a clear user-facing message
    if (/Could not find the 'birthday' column|PGRST204/i.test(fullMessage)) {
      throw new Error("Erro ao criar cliente: problema no servidor relacionado ao campo de aniversário. Tente salvar sem informar a data de aniversário ou atualize o banco de dados.")
    }

    // friendly message when CPF-related constraint fails
    if (/cpf|duplicate|unique|constraint/i.test(fullMessage)) {
      throw new Error("Erro ao criar cliente: CPF inválido ou já cadastrado. O CPF é opcional — tente deixar em branco.")
    }

    // return the real DB error to the client to aid debugging
    throw new Error(fullMessage)
  }

  await createNotification("Cliente Adicionado", `${patientData.name} foi adicionado com sucesso.`, "success")

  // Atualiza as metas de clientes
  await updateGoalsForAction({ type: "patient" })

  return data as Patient
}

export async function updatePatient(
  patientId: string,
  patientData: {
    name: string
    email: string
    phone: string
    cpf?: string
    date_of_birth?: string
    birthday?: string
    address?: string
    notes?: string
    profile_photo_url?: string
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

  // normalize cpf: convert empty string to null to avoid constraint issues
  const updatePayload: any = {
    ...patientData,
    date_of_birth: patientData.date_of_birth || null,
    address: patientData.address || null,
    notes: patientData.notes || null,
    profile_photo_url: patientData.profile_photo_url || null,
    updated_at: new Date().toISOString(),
  }
  if (Object.prototype.hasOwnProperty.call(patientData, "cpf")) {
    updatePayload.cpf = patientData.cpf && patientData.cpf.trim() !== "" ? patientData.cpf.trim() : null
  }

  const { data, error } = await supabase.from("patients").update(updatePayload).eq("id", patientId).eq("user_id", user.id).select().single()

  if (error) {
    console.error(" Error updating patient:", error)
    throw new Error("Failed to update patient")
  }

  await createNotification("Cliente Atualizado", `${patientData.name} foi atualizado com sucesso.`, "info")

  return data as Patient
}

export async function updatePatientNotes(patientId: string, notes: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("patients")
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating patient notes:", error)
    throw new Error("Failed to update patient notes")
  }

  return data as Patient
}

export async function updatePatientPhoto(patientId: string, photoUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("patients")
    .update({
      profile_photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating patient photo:", error)
    throw new Error("Failed to update patient photo")
  }

  return data as Patient
}

export async function deletePatient(patientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("patients").delete().eq("id", patientId).eq("user_id", user.id)

  if (error) {
    console.error(" Error deleting patient:", error)
    throw new Error("Failed to delete patient")
  }

  await createNotification("Paciente Removido", "Paciente foi removido com sucesso.", "info")

  return { success: true }
}

export async function updatePatientStatus(patientId: string, status: "active" | "inactive") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("patients")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", patientId)
    .eq("user_id", user.id)

  if (error) {
    console.error(" Error updating patient status:", error)
    throw new Error("Failed to update patient status")
  }

  return { success: true }
}

export async function checkOverduePayments() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return []
  }

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .eq("payment_status", "overdue")
    .lt("payment_due_date", today)

  if (error) {
    console.error(" Error checking overdue payments:", error)
    return []
  }

  // Create notifications for overdue payments
  for (const patient of data) {
    await createNotification(
      "Pagamento Atrasado",
      `Paciente ${patient.name} está com pagamento atrasado desde ${new Date(patient.payment_due_date!).toLocaleDateString("pt-BR")}.`,
      "warning",
    )
  }

  return data as Patient[]
}
