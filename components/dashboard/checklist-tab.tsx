"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { getTodos, createTodo, updateTodo, toggleTodoComplete, deleteTodo, Todo } from "@/app/actions/todos"
import { useToast } from "@/hooks/use-toast"

export default function ChecklistTab() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDue, setNewDue] = useState<string | undefined>(undefined)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTodos()
      setTodos(data || [])
    } catch (err) {
      toast({ title: "Erro ao carregar checklist", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const t = await createTodo({ title: newTitle.trim(), due_date: newDue || null })
      setTodos((s) => [t, ...s])
      setNewTitle("")
      setNewDue(undefined)
      toast({ title: "Item adicionado" })
    } catch (err) {
      toast({ title: "Erro ao adicionar", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updated = await toggleTodoComplete(id, completed)
      setTodos((s) => s.map((x) => (x.id === id ? updated : x)))
    } catch (err) {
      toast({ title: "Erro ao atualizar", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id)
      setTodos((s) => s.filter((x) => x.id !== id))
      toast({ title: "Item removido" })
    } catch (err) {
      toast({ title: "Erro ao remover", description: err instanceof Error ? err.message : String(err), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Checklist</h3>
          <div className="flex items-center gap-2">
            <Input placeholder="Título do item" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-64" />
            <Input type="date" value={newDue || ""} onChange={(e) => setNewDue(e.target.value || undefined)} className="w-40" />
            <Button className="bg-primary text-primary-foreground" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum item na checklist</div>
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={t.completed} onChange={(e) => handleToggle(t.id, e.target.checked)} />
                  <div>
                    <div className={`font-medium ${t.completed ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    <div className="text-sm text-muted-foreground">{t.due_date ? new Date(t.due_date).toLocaleDateString() : "Sem data"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
