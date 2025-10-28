"use server"

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "./notifications"
import { getUserSubscription } from "./subscription"
import { checkLimit } from "@/lib/usage-stats"

export interface Professional {
  id: string
  user_id: string
  name: string
  specialty: string
  email: string
  phone: string
  crm?: string | null
  work_days: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export async function getProfessionals() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching professionals:", error)
    throw new Error("Failed to fetch professionals")
  }

  return data as Professional[]
}

export async function createProfessional(professionalData: {
  name: string
  specialty: string
  email: string
  phone: string
  crm?: string
  work_days?: string
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

  const limitCheck = await checkLimit(planType, "professionals")

  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Limite de profissionais atingido.")
  }

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      user_id: user.id,
      ...professionalData,
      crm: professionalData.crm || null,
      work_days: professionalData.work_days || null,
      notes: professionalData.notes || null,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error(" Error creating professional:", error)
    throw new Error("Failed to create professional")
  }

  await createNotification("Profissional Adicionado", `${professionalData.name} foi adicionado com sucesso.`, "success")

  return data as Professional
}

export async function updateProfessional(
  professionalId: string,
  professionalData: {
    name: string
    specialty: string
    email: string
    phone: string
    crm?: string
    work_days?: string
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
    .from("professionals")
    .update({
      ...professionalData,
      crm: professionalData.crm || null,
      work_days: professionalData.work_days || null,
      notes: professionalData.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", professionalId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error(" Error updating professional:", error)
    throw new Error("Failed to update professional")
  }

  await createNotification("Profissional Atualizado", `${professionalData.name} foi atualizado com sucesso.`, "info")

  return data as Professional
}

export async function deleteProfessional(professionalId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("professionals").delete().eq("id", professionalId).eq("user_id", user.id)

  if (error) {
    console.error(" Error deleting professional:", error)
    throw new Error("Failed to delete professional")
  }

  await createNotification("Profissional Removido", "Profissional foi removido com sucesso.", "info")

  return { success: true }
}

export async function updateProfessionalStatus(professionalId: string, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("professionals")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", professionalId)
    .eq("user_id", user.id)

  if (error) {
    console.error(" Error updating professional status:", error)
    throw new Error("Failed to update professional status")
  }

  return { success: true }
}
