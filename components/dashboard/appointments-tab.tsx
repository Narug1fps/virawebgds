"use client"
import CalendarAppointments from "@/components/calendar-appointments"

interface Appointment {
  id: string
  patient: string
  professional: string
  date: string
  time: string
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
}

export default function AppointmentsTab() {
  return <CalendarAppointments />
}

// The rest of the code for managing appointments is replaced by the CalendarAppointments component
