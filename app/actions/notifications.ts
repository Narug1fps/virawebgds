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
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error(" Error fetching notifications:", error)
    throw new Error("Failed to fetch notifications")
  }

  return data as Notification[]
}

export async function getUnreadCount() {
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
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error(" Error marking notification as read:", error)
    throw new Error("Failed to mark notification as read")
  }

  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error(" Error marking all notifications as read:", error)
    throw new Error("Failed to mark all notifications as read")
  }

  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user.id)

  if (error) {
    console.error(" Error deleting notification:", error)
    throw new Error("Failed to delete notification")
  }

  return { success: true }
}

export async function createNotification(
  title: string,
  message: string,
  type: "info" | "warning" | "error" | "success",
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
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
    throw new Error("Failed to create notification")
  }

  return { success: true }
}
