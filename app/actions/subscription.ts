"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface UserSubscription {
  id: string
  user_id: string
  plan_name: "basic" | "premium" | "master"
  plan_type: "basic" | "premium" | "master"
  status: "active" | "canceled" | "expired"
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  max_patients: number | null
  max_professionals: number | null
  max_appointments_per_month: number | null
  virabot_enabled: boolean
  created_at: string
  updated_at: string
}

export async function getCurrentPlan(): Promise<"basic" | "premium" | "master"> {
  try {
    const subscription = await getUserSubscription()

    if (!subscription || subscription.status !== "active") {
      return "basic"
    }

    const planType = (subscription.plan_name || subscription.plan_type)?.toLowerCase() as "basic" | "premium" | "master"

    if (!["basic", "premium", "master"].includes(planType)) {
      console.error(" Invalid plan type detected:", subscription.plan_name)
      return "basic"
    }

    return planType
  } catch (err) {
    console.error("Error in getCurrentPlan:", err)
    return "basic"
  }
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error)
      return null
    }

    if (data) {
      if (data.plan_name) {
        data.plan_name = data.plan_name.toLowerCase()
        data.plan_type = data.plan_name
      }
    }

    return data as UserSubscription | null
  } catch (err) {
    console.error("Critical error in getUserSubscription:", err)
    return null
  }
}

export async function hasAIAccess(): Promise<boolean> {
  const subscription = await getUserSubscription()

  if (!subscription) {
    return false
  }

  return subscription.virabot_enabled === true
}

export async function updateSubscriptionStatus(subscriptionId: string, status: "active" | "canceled" | "expired") {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating subscription:", error)
    throw new Error(error.message || "Failed to update subscription")
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard/subscription")

  return data as UserSubscription
}
