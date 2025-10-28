import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { streamText, tool } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 🔐 Autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id
    console.log(" 🤖 Chat request from user:", userId)

    // 🔍 Verifica plano do usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan_name, virabot_enabled, status")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single()

    if (subscriptionError) {
      console.warn("Could not fetch subscription for user", userId, subscriptionError)
    }

    // Access rules:
    // - If subscription.virabot_enabled is true => allow
    // - Or if plan_name is "master" or "premium" (older rows or missing flag) => allow
    const hasAccess = !!subscription && (subscription.virabot_enabled === true || subscription.plan_name === "master" || subscription.plan_name === "premium")

    if (!hasAccess) {
      console.log("ViraBot access denied. Subscription:", subscription)
      return NextResponse.json(
        { error: "ViraBot está disponível apenas para planos Premium e Master" },
        { status: 403 },
      )
    }

    // 📥 Mensagens do usuário
    const body = await request.json()
    const { messages } = body
    console.log(" 📨 Received messages:", messages.length)

    // Intercept common intents and answer directly from the DB.
    // The previous `tool`/AI-tooling wasn't reliably invoking tools in this environment,
    // so we handle the expected intents explicitly here to guarantee correct answers.
    const lastMessage = Array.isArray(messages) && messages.length ? messages[messages.length - 1] : null
    const userText = lastMessage?.role === "user" ? String(lastMessage.content).toLowerCase() : String(messages).toLowerCase()

    const FALLBACK =
      "Não tenho capacidade para responder isso e quiser me perguntar algo sobre a sua conta da ViraWeb ficarei feliz em responder."

    // Helper DB queries
    const getCount = async (table: string) => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true }).eq("user_id", userId)
      if (error) throw error
      return count || 0
    }

    const formatAppointments = (rows: any[]) => {
      if (!rows || rows.length === 0) return "Nenhum agendamento encontrado."
      return rows
        .map((r) => `${r.date} ${r.time} — ${r.patients?.name || "Cliente não especificado"} ( ${r.professionals?.name || "Profissional não especificado"} )`)
        .join('\n')
    }

    try {
      // Intents: counts
      if (/quantos?.*profissional|quantos profissionais|número de profissionais/.test(userText)) {
        const n = await getCount("professionals")
        const reply = `Você tem ${n} ${n === 1 ? "profissional" : "profissionais"} cadastrad${n === 1 ? "o" : "os"} no sistema.`
        return new Response(reply)
      }

      if (/quantos?.*cliente|quantos clientes|número de clientes/.test(userText)) {
        const n = await getCount("patients")
        const reply = `Você tem ${n} ${n === 1 ? "cliente" : "clientes"} cadastrad${n === 1 ? "o" : "os"} no ViraWeb.`
        return new Response(reply)
      }

      if (/quantos?.*agendamentos|número de agendamentos|quantos agendamentos/.test(userText)) {
        const n = await getCount("appointments")
        const reply = `Você tem ${n} ${n === 1 ? "agendamento" : "agendamentos"}.`
        return new Response(reply)
      }

      if (/próximos agendamentos|proximos agendamentos|próximo agendamento|agendamentos próximos|agendamentos futuros/.test(userText)) {
        const today = new Date().toISOString().split("T")[0]
        const { data, error } = await supabase
          .from("appointments")
          .select(`id, date, time, patients!inner (name), professionals!inner (name)`)
          .eq("user_id", userId)
          .gte("date", today)
          .order("date", { ascending: true })
          .order("time", { ascending: true })
          .limit(5)

        if (error) throw error
        const text = formatAppointments(data || [])
        return new Response(`Próximos agendamentos:\n${text}`)
      }

      if (/agendamentos recentes|últimos agendamentos|ultimos agendamentos/.test(userText)) {
        const { data, error } = await supabase
          .from("appointments")
          .select(`id, date, time, patients!inner (name), professionals!inner (name)`)
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .order("time", { ascending: false })
          .limit(5)

        if (error) throw error
        const text = formatAppointments(data || [])
        return new Response(`Agendamentos recentes:\n${text}`)
      }

      if (/estatística|estatisticas|limites do plano|estatísticas do sistema/.test(userText)) {
        const [clientsResult, professionalsResult, appointmentsResult, statsResult] = await Promise.all([
          supabase.from("patients").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("professionals").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("appointments").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase
            .from("subscriptions")
            .select("plan_name, max_patients, max_professionals, max_appointments_per_month")
            .eq("user_id", userId)
            .eq("status", "active")
            .single(),
        ])

        const stats = statsResult.data
        const usage = {
          clients: clientsResult.count || 0,
          professionals: professionalsResult.count || 0,
          appointments: appointmentsResult.count || 0,
        }
        const limits = {
          clients: stats?.max_patients || "sem limite",
          professionals: stats?.max_professionals || "sem limite",
          appointments: stats?.max_appointments_per_month || "sem limite",
        }

        const reply = `Estatísticas de uso:\n- Clientes: ${usage.clients}\n- Profissionais: ${usage.professionals}\n- Agendamentos (mês): ${usage.appointments}\nLimites do plano:\n- Clientes: ${limits.clients}\n- Profissionais: ${limits.professionals}\n- Agendamentos/mês: ${limits.appointments}`
        return new Response(reply)
      }

      // Financial intents
      if (/quanto.*dev(e|endo)|quanto.*deve/.test(userText)) {
        // Try to extract patient name from the question
        const nameMatch = userText.match(/cliente\s+([a-zçãõáéíóú\-\s]{2,50})/) || userText.match(/paciente\s+([a-zçãõáéíóú\-\s]{2,50})/)
        const name = nameMatch ? nameMatch[1].trim() : null

        if (!name) return new Response("Qual o nome do cliente que você quer consultar?")

        // Find patient
        const { data: patientList, error: patientError } = await supabase
          .from("patients")
          .select("id, name")
          .ilike("name", `%${name}%`)
          .eq("user_id", userId)
          .limit(1)

        if (patientError || !patientList || patientList.length === 0) {
          return new Response(`Não encontrei um cliente com o nome "${name}".`)
        }

        const patient = patientList[0]

        // Sum payments
        const { data: payments } = await supabase
          .from("payments")
          .select("amount,discount,status")
          .eq("user_id", userId)
          .eq("patient_id", patient.id)

        const { data: sessions } = await supabase
          .from("financial_sessions")
          .select("unit_price,discount,paid")
          .eq("user_id", userId)
          .eq("patient_id", patient.id)

        let paid = 0
        let due = 0
        let discounts = 0

        ;(payments || []).forEach((p: any) => {
          if (p.status === "paid") paid += Number(p.amount || 0)
          if (p.status === "pending" || p.status === "overdue") due += Number(p.amount || 0) - Number(p.discount || 0)
          if (p.discount) discounts += Number(p.discount || 0)
        })

        ;(sessions || []).forEach((s: any) => {
          const price = Number(s.unit_price || 0)
          const disc = Number(s.discount || 0)
          if (s.paid) paid += price - disc
          else due += price - disc
          if (disc) discounts += disc
        })

        const statusText = due > 0 ? `Devendo R$ ${due.toFixed(2)}` : `Em dia (total pago R$ ${paid.toFixed(2)})`
        const reply = `Resumo financeiro de ${patient.name}: ${statusText}. Descontos aplicados: R$ ${discounts.toFixed(2)}.`
        return new Response(reply)
      }

      if (/total.*recebido.*(semana|esta semana|essa semana)/.test(userText) || /recebido.*semana/.test(userText)) {
        const now = new Date()
        const start = new Date()
        start.setDate(now.getDate() - 7)
        const startISO = start.toISOString()

        const { data: payments, error: payErr } = await supabase
          .from("payments")
          .select("amount,discount,status")
          .eq("user_id", userId)
          .gte("payment_date", startISO)

        if (payErr) throw payErr

        let total = 0
        ;(payments || []).forEach((p: any) => {
          if (p.status === "paid") total += Number(p.amount || 0)
        })

        return new Response(`Total recebido na última semana: R$ ${total.toFixed(2)}`)
      }

      if (/clientes.*desconto|quem.*desconto|quais clientes.*desconto/.test(userText)) {
        const { data, error } = await supabase
          .from("payments")
          .select("patient_id,discount, patients (name)")
          .eq("user_id", userId)
          .gt("discount", 0)
          .limit(20)

        if (error) throw error

        const names = (data || []).map((r: any) => r.patients?.name).filter(Boolean)
        if (!names || names.length === 0) return new Response("Nenhum cliente com desconto encontrado.")
        return new Response(`Clientes com desconto: ${[...new Set(names)].join(", ")}`)
      }

      if (/mais sessões.*m(e|ê)s|quem fez mais sessões.*m(e|ê)s/.test(userText)) {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data: sessions, error: sessErr } = await supabase
          .from("financial_sessions")
          .select("patient_id")
          .eq("user_id", userId)
          .gte("session_date", firstDayOfMonth)

        if (sessErr) throw sessErr

        const counts: Record<string, number> = {}
        ;(sessions || []).forEach((s: any) => {
          const pid = s.patient_id || "unknown"
          counts[pid] = (counts[pid] || 0) + 1
        })

        const entries = Object.entries(counts).filter(([id]) => id !== "unknown")
        if (entries.length === 0) return new Response("Nenhuma sessão registrada neste mês.")

        entries.sort((a, b) => b[1] - a[1])
        const top = entries[0]
        const { data: patient } = await supabase.from("patients").select("name").eq("id", top[0]).single()

        return new Response(`Quem fez mais sessões neste mês: ${patient?.name || "Desconhecido"} (${top[1]} sessões).`)
      }

      // If none of the above intents match, return the fallback message so user isn't confused.
      return new Response(FALLBACK)
    } catch (err) {
      console.error("Erro ao consultar o banco para intent detection:", err)
      return new Response(FALLBACK)
    }
  } catch (error) {
    console.error(" ❌ AI chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
