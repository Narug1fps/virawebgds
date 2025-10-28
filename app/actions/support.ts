"use server"

import { createClient } from "@/lib/supabase/server"
import { sendEmail, generateSupportTicketEmail, generateSupportReplyEmail } from "@/lib/email"

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  is_staff: boolean
  created_at: string
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tickets:", error)
    throw new Error("Failed to fetch tickets")
  }

  return data as SupportTicket[]
}

export async function createSupportTicket(
  subject: string,
  message: string,
  priority: "low" | "medium" | "high" | "urgent" = "medium",
): Promise<SupportTicket> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject,
      message,
      priority,
      status: "open",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating ticket:", error)
    throw new Error("Failed to create ticket")
  }

  await notifyDevAboutNewTicket(data.id, subject, message, user.email || "Unknown user", priority)

  return data as SupportTicket
}

export async function getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    throw new Error("Failed to fetch messages")
  }

  return data as SupportMessage[]
}

export async function addTicketMessage(ticketId: string, message: string): Promise<SupportMessage> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticketId,
      user_id: user.id,
      message,
      is_staff: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding message:", error)
    throw new Error("Failed to add message")
  }

  const { data: ticket } = await supabase.from("support_tickets").select("subject").eq("id", ticketId).single()

  await notifyDevAboutSupportMessage(ticketId, ticket?.subject || "Ticket", message, user.email || "Unknown user")

  return data as SupportMessage
}

async function notifyDevAboutNewTicket(
  ticketId: string,
  subject: string,
  message: string,
  userEmail: string,
  priority: string,
) {
  try {
    const devEmail = process.env.DEV_SUPPORT_EMAIL || "vitorrocketleague@gmail.com"

    const emailContent = generateSupportTicketEmail({
      ticketId,
      subject,
      message,
      userEmail,
      priority,
    })

    await sendEmail({
      to: devEmail,
      subject: `[NOVO TICKET] ${subject}`,
      html: emailContent.html,
      text: emailContent.text,
    })

    console.log(`[SUPPORT] New ticket notification sent to ${devEmail}`)
  } catch (error) {
    console.error("Error notifying dev about new ticket:", error)
  }
}

async function notifyDevAboutSupportMessage(
  ticketId: string,
  ticketSubject: string,
  message: string,
  userEmail: string,
) {
  try {
    const devEmail = process.env.DEV_SUPPORT_EMAIL || "vitorrocketleague@gmail.com"

    const emailContent = generateSupportReplyEmail({
      ticketId,
      ticketSubject,
      message,
      userEmail,
    })

    await sendEmail({
      to: devEmail,
      subject: `[RESPOSTA] ${ticketSubject}`,
      html: emailContent.html,
      text: emailContent.text,
    })

    console.log(`[SUPPORT] Message notification sent to ${devEmail}`)
  } catch (error) {
    console.error("Error notifying dev about support message:", error)
  }
}
