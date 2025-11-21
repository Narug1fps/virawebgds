"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, Check, Clock } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { Payment } from "@/app/actions/financial-actions"
import { AttendanceTab } from "@/components/financial/attendance-tab"

interface PatientFinancialTabProps {
  patientId: string
  payments: Payment[]
  onOpenPaymentModal?: (pendingPaymentId?: string | null) => void
}

// columns are defined inside the component so we can close over props (eg. onOpenPaymentModal)

export function PatientFinancialTab({ patientId, payments, onOpenPaymentModal }: PatientFinancialTabProps) {
  const [loading] = useState(false)

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "payment_date",
      header: "Data",
      cell: ({ row }) => {
        const date = row.getValue("payment_date") as string
        return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "-"
      },
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const discount = parseFloat(row.getValue("discount") || "0")
        return `R$ ${(amount - discount).toFixed(2)}`
      },
    },
    {
      accessorKey: "discount",
      header: "Desconto",
      cell: ({ row }) => {
        const discount = parseFloat(row.getValue("discount") || "0")
        return discount > 0 ? `R$ ${discount.toFixed(2)}` : "-"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div className="flex items-center">
            {status === "paid" && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs flex items-center">
                <Check className="w-3 h-3 mr-1" />
                Pago
              </span>
            )}
            {status === "pending" && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Pendente
              </span>
            )}
            {status === "overdue" && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Atrasado
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "due_date",
      header: "Vencimento",
      cell: ({ row }) => {
        const date = row.getValue("due_date") as string
        return date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : "-"
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <div>
            {(status === 'pending' || status === 'overdue') && (
              <button
                className="text-sm text-primary underline"
                onClick={() => onOpenPaymentModal && onOpenPaymentModal(row.original.id)}
              >
                Registrar pagamento
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <Tabs defaultValue="history" className="w-full">
      <TabsList>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="space-y-4">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          noResults="Nenhum pagamento encontrado"
        />
      </TabsContent>

      
    </Tabs>
  )
}
