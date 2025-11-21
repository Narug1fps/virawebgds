"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase-client"
import { fetchJson } from "@/lib/fetch-client"

interface Subscription {
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

export function useSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        data.plan_type = data.plan_name || data.plan_type
      }

      setSubscription(data || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscription")
      // Don't clear subscription on error - keep the old value
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    fetchSubscription()

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log(" Subscription changed:", payload)
          fetchSubscription()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchSubscription])

  const createSubscription = async (planType: "basic" | "premium" | "master") => {
    try {
      const data = await fetchJson("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: planType }),
      })

      setSubscription(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create subscription"
      setError(message)
      throw err
    }
  }

  const cancelSubscription = async () => {
    if (!subscription) return

    try {
      const data = await fetchJson("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subscription.id, status: "canceled" }),
      })

      setSubscription(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel subscription"
      setError(message)
      throw err
    }
  }

  const refreshSubscription = async () => {
    await fetchSubscription()
  }

  return {
    subscription,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    refreshSubscription,
  }
}
