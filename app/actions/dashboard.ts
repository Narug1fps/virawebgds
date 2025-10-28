"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const today = new Date().toISOString().split("T")[0]

  const { count: appointmentsToday } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("appointment_date", today)

  const { count: activePatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active")

  // Get completed appointments this month
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  const { count: completedThisMonth } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("appointment_date", firstDayOfMonth)

  const { count: totalThisMonth } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("appointment_date", firstDayOfMonth)

  const completionRate = totalThisMonth ? Math.round((completedThisMonth! / totalThisMonth) * 100) : 0

  // Get growth rate (compare this month to last month)
  const firstDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString()
    .split("T")[0]
  const lastDayOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split("T")[0]

  const { count: lastMonthAppointments } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("appointment_date", firstDayOfLastMonth)
    .lte("appointment_date", lastDayOfLastMonth)

  const growthRate = lastMonthAppointments
    ? Math.round(((totalThisMonth! - lastMonthAppointments) / lastMonthAppointments) * 100)
    : 0

  return {
    appointmentsToday: appointmentsToday || 0,
    activePatients: activePatients || 0,
    completionRate,
    growthRate,
  }
}

export async function getUpcomingAppointments() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const today = new Date().toISOString().split("T")[0]

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patients (name),
      professionals (name)
    `,
    )
    .eq("user_id", user.id)
    .gte("appointment_date", today)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .limit(5)

  if (error) {
    console.error("Error fetching upcoming appointments:", error)
    return []
  }

  if (!appointments || appointments.length === 0) {
    return []
  }

  return appointments.map((apt: any) => ({
    id: apt.id,
    patient: apt.patients?.name || "Paciente desconhecido",
    professional: apt.professionals?.name || "Profissional desconhecido",
    time: apt.appointment_time.substring(0, 5),
    date: apt.appointment_date,
    status: apt.status,
  }))
}

export async function getRecentPatients() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User not authenticated")
  }

  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5)

  if (error) {
    console.error("Error fetching recent patients:", error)
    return []
  }

  if (!patients || patients.length === 0) {
    return []
  }

  return patients.map((patient) => {
    const updatedAt = new Date(patient.updated_at)
    const now = new Date()
    const diffMs = now.getTime() - updatedAt.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    let lastVisit = "Hoje"
    if (diffDays === 1) lastVisit = "Ontem"
    else if (diffDays > 1) lastVisit = `${diffDays} dias atrás`

    return {
      id: patient.id,
      name: patient.name,
      lastVisit,
      status: patient.status,
    }
  })
}

export async function getTodayBirthdays() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // Data de hoje considerando o fuso horário local (Brasil)
  const today = new Date();
  const localMonth = today.getMonth() + 1;
  const localDay = today.getDate();

  // Busca pacientes
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, name, phone, birthday")
    .eq("user_id", user.id)
    .not("birthday", "is", null);

  // Busca profissionais
  const { data: professionals, error: professionalsError } = await supabase
    .from("professionals")
    .select("id, name, phone, birthday")
    .eq("user_id", user.id)
    .not("birthday", "is", null);

  if (patientsError) console.error("Erro buscando pacientes:", patientsError);
  if (professionalsError) console.error("Erro buscando profissionais:", professionalsError);

  const allPeople = [
    ...(patients || []).map((p) => ({ ...p, type: "client" as const })),
    ...(professionals || []).map((p) => ({ ...p, type: "professional" as const })),
  ];

  // Corrige a leitura da data para evitar erro de UTC → local
  const birthdaysToday = allPeople.filter((person) => {
    if (!person.birthday) return false;

    const birthdayDate = new Date(person.birthday + "T00:00:00"); // força meia-noite local
    const month = birthdayDate.getMonth() + 1;
    const day = birthdayDate.getDate();

    return month === localMonth && day === localDay;
  });

  return birthdaysToday.map((person) => ({
    id: person.id,
    name: person.name,
    phone: person.phone,
    birthday: person.birthday,
    type: person.type,
  }));
}
