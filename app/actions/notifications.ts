"use server"

import { createClient } from "@/lib/supabase/server"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  read: boolean
  created_at: string
  updated_at: string
}

export async function getNotifications() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return []
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error(" Error fetching notifications:", error)
      return []
    }

    return (data || []) as Notification[]
  } catch (err) {
    console.error("Critical error in getNotifications:", err)
    return []
  }
}

export async function getUnreadCount() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return 0
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      console.error(" Error fetching unread count:", error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error("Critical error in getUnreadCount:", err)
    return 0
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) {
      console.error(" Error marking notification as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Critical error in markAsRead:", err)
    return { success: false, error: "Internal error" }
  }
}

export async function markAllAsRead() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      console.error(" Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Critical error in markAllAsRead:", err)
    return { success: false, error: "Internal error" }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user.id)

    if (error) {
      console.error(" Error deleting notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Critical error in deleteNotification:", err)
    return { success: false, error: "Internal error" }
  }
}

export async function createNotification(
  title: string,
  message: string,
  type: "info" | "warning" | "error" | "success",
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      title,
      message,
      type,
      read: false,
    })

    if (error) {
      console.error(" Error creating notification:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Critical error in createNotification:", err)
    return { success: false, error: "Internal error" }
  }
}
