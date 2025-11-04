"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Menu,
  X,
  Calendar,
  Users,
  BarChart3,
  Home,
  CreditCard,
  List,
  Sparkles,
  Target,
  Settings,
  HeadphonesIcon,
  StickyNote,
} from "lucide-react"
import ChecklistTab from "./dashboard/checklist-tab"
import OverviewTab from "./dashboard/overview-tab"
import AppointmentsTab from "./dashboard/appointments-tab"
import PatientsTab from "./dashboard/patients-tab"
import ProfessionalsTab from "./dashboard/professionals-tab"
import ReportsTab from "./dashboard/reports-tab"
import SubscriptionsTab from "./dashboard/subscriptions-tab"
import FinancialTab from "./dashboard/financial-tab"
import AISection from "./dashboard/ai-section"
import { GoalsSection } from "./dashboard/goals-section"
import SettingsTab from "./dashboard/settings-tab"
import SupportTab from "./dashboard/support-tab"
import NotesTab from "./dashboard/notes-tab"
import NotificationsPanel from "./notifications-panel"
import Image from "next/image"

interface Subscription {
  id: string
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

interface DashboardProps {
  user: { email: string; name: string }
  onLogout: () => void
  subscription?: Subscription
}

export default function Dashboard({ user, onLogout, subscription }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const navItems = [
    { id: "overview", label: "Visão Geral", icon: <Home className="w-5 h-5" /> },
    { id: "notes", label: "Notas", icon: <StickyNote className="w-5 h-5" /> },
  { id: "checklist", label: "Checklist", icon: <List className="w-5 h-5" /> },
    { id: "ai", label: "ViraBot IA", icon: <Sparkles className="w-5 h-5" /> },
    { id: "goals", label: "Metas", icon: <Target className="w-5 h-5" /> },
    { id: "appointments", label: "Agendamentos", icon: <Calendar className="w-5 h-5" /> },
    { id: "patients", label: "Clientes", icon: <Users className="w-5 h-5" /> },
    { id: "financial", label: "Financeiro", icon: <CreditCard className="w-5 h-5" /> },
    { id: "professionals", label: "Profissionais", icon: <Users className="w-5 h-5" /> },
    { id: "reports", label: "Relatórios", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "subscriptions", label: "Assinatura", icon: <CreditCard className="w-5 h-5" /> },
    { id: "support", label: "Suporte", icon: <HeadphonesIcon className="w-5 h-5" /> },
    { id: "settings", label: "Configurações", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <Image width={512} height={512} alt="" src="/viraweb3.png" className="w-40" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsPanel />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } border-r border-border bg-card transition-all duration-300 overflow-hidden lg:w-64`}
        >
          <nav className="p-4 space-y-2  h-[calc(100vh-73px)] overflow-y-auto">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {activeTab === "overview" && <OverviewTab user={user} onNavigate={(tab) => setActiveTab(tab)} />}
              {activeTab === "notes" && <NotesTab />}
              {activeTab === "checklist" && <ChecklistTab />}
              {activeTab === "ai" && <AISection planType={subscription?.plan_type || "basic"} />}
              {activeTab === "goals" && <GoalsSection />}
              {activeTab === "appointments" && <AppointmentsTab />}
              {activeTab === "patients" && <PatientsTab />}
              {activeTab === "financial" && <FinancialTab />}
              {activeTab === "professionals" && <ProfessionalsTab />}
              {activeTab === "reports" && <ReportsTab />}
              {activeTab === "subscriptions" && <SubscriptionsTab subscription={subscription} />}
              {activeTab === "support" && <SupportTab />}
              {activeTab === "settings" && <SettingsTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md"
          : "text-foreground hover:bg-muted"
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}
