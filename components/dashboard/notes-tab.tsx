"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Save, X, Loader2, StickyNote } from "lucide-react"
import { getUserNotes, createUserNote, updateUserNote, deleteUserNote, type UserNote } from "@/app/actions/user-notes"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export default function NotesTab() {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await getUserNotes()
      setNotes(data)
    } catch (error) {
      toast({
        title: "Erro ao carregar notas",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e o conteúdo",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateUserNote(editingId, formData.title, formData.content)
        toast({
          title: "Nota atualizada",
          description: "Sua nota foi atualizada com sucesso",
        })
      } else {
        await createUserNote(formData.title, formData.content)
        toast({
          title: "Nota criada",
          description: "Nova nota adicionada com sucesso",
        })
      }

      await loadNotes()
      setFormData({ title: "", content: "" })
      setShowForm(false)
      setEditingId(null)
    } catch (error) {
      toast({
        title: "Erro ao salvar nota",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEditNote = (note: UserNote) => {
    setFormData({
      title: note.title,
      content: note.content,
    })
    setEditingId(note.id)
    setShowForm(true)
  }

  const handleDeleteNote = async (id: string) => {
    // Show a toast confirmation instead of native confirm dialog
    const t = toast({
      title: "Confirmar exclusão?",
      description: "Clique em Excluir para confirmar ou feche esta notificação para cancelar.",
      // action must be a ToastAction element
      action: (
        <ToastAction
          altText="Confirmar exclusão"
          onClick={async () => {
            try {
              // show temporary feedback (include id to satisfy type)
              t.update({ id: t.id, title: "Excluindo...", description: "Aguarde" } as any)
              await deleteUserNote(id)
              t.update({ id: t.id, title: "Nota excluída", description: "Nota removida com sucesso" } as any)
              // refresh list
              await loadNotes()
              // dismiss after short delay
              setTimeout(() => t.dismiss(), 1500)
            } catch (error) {
              t.update({
                id: t.id,
                title: "Erro ao excluir nota",
                description: error instanceof Error ? error.message : "Tente novamente",
                // mark as destructive
                variant: "destructive",
              } as any)
            }
          }}
        >
          Excluir
        </ToastAction>
      ),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Minhas Notas</h2>
          <p className="text-muted-foreground mt-1">Organize suas anotações e lembretes</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setFormData({ title: "", content: "" })
            setShowForm(!showForm)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Nova Nota
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 border border-border bg-gradient-to-br from-primary/5 to-secondary/5">
          <h3 className="text-lg font-bold text-foreground mb-4">{editingId ? "Editar Nota" : "Nova Nota"}</h3>
          <div className="space-y-4">
            <Input
              placeholder="Título da nota"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background"
            />
            <Textarea
              placeholder="Conteúdo da nota..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[200px] bg-background"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSaveNote}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? (saving ? "Atualizando..." : "Atualizar") : saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Notes Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <Card key={note.id} className="p-6 border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <StickyNote className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <h3 className="font-bold text-foreground text-lg mb-2">{note.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-4 mb-4">{note.content}</p>

              <div className="text-xs text-muted-foreground">
                Atualizado em {new Date(note.updated_at).toLocaleDateString("pt-BR")}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 border border-border text-center sm:col-span-2 lg:col-span-3">
            <StickyNote className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma nota criada</p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Nota
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
