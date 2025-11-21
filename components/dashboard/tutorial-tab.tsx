"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle, CheckCircle2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { TUTORIAL_VIDEO_URL } from "@/lib/tutorial-config"

function getEmbedUrl(url: string) {
  try {
    const u = new URL(url)
    // youtube.com/watch?v=ID or youtu.be/ID
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
  } catch (e) {}
  // fallback: return original (may already be an embed URL)
  return url
}

export default function TutorialTab({ onMarkWatched }: { onMarkWatched?: () => void }) {
  const [hasWatchedTutorial, setHasWatchedTutorial] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadTutorialStatus()
  }, [])

  const loadTutorialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('has_watched_tutorial')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setHasWatchedTutorial(data?.has_watched_tutorial || false)
    } catch (error) {
      console.error('Error loading tutorial status:', error)
    } finally {
      setLoading(false)
    }
  }

  const markTutorialAsWatched = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting supabase user before marking tutorial:', userError)
        throw userError
      }

      if (!user) {
        console.warn('No authenticated user found when marking tutorial as watched')
        throw new Error('Usuário não autenticado')
      }

      // Use upsert with onConflict and request the updated row back so we
      // can inspect any returned data/errors and provide clearer logs.
      const upsertRes: any = await supabase
        .from('user_settings')
        .upsert([
          {
            user_id: user.id,
            has_watched_tutorial: true,
          },
        ], { onConflict: 'user_id' })
        .select()
        .single()

      if (upsertRes.error) {
        // Log the full error object returned by Supabase for diagnosis
        console.error('Supabase upsert error for user_settings:', upsertRes.error, upsertRes)
        throw upsertRes.error
      }

      // Success
      setHasWatchedTutorial(true)
      // Notify parent (Dashboard) so it can remove the notification badge
      if (onMarkWatched) onMarkWatched()
      toast({
        title: 'Tutorial concluído!',
        description: 'Obrigado por assistir ao tutorial.',
      })
    } catch (err: any) {
      // Provide more detailed message when available
      console.error('Error marking tutorial as watched:', err)
      const message = err?.message || (err?.error_description ?? 'Por favor, tente novamente.')
      toast({
        title: 'Erro ao marcar tutorial como visto',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            {TUTORIAL_VIDEO_URL ? (
              <iframe
                src={getEmbedUrl(TUTORIAL_VIDEO_URL)}
                className="w-full h-full"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Tutorial ViraWeb"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-primary" />
                <span className="absolute mt-24 text-muted-foreground">Vídeo em breve!</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Tutorial do ViraWeb</h2>
            <p className="text-muted-foreground">
              Aprenda a usar todas as funcionalidades da plataforma para aproveitar ao máximo suas ferramentas.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {hasWatchedTutorial ? (
              <Button variant="outline" className="gap-2" disabled>
                <CheckCircle2 className="w-4 h-4" />
                Tutorial Concluído
              </Button>
            ) : (
              <Button onClick={markTutorialAsWatched} className="gap-2">
                <PlayCircle className="w-4 h-4" />
                Marcar como Visto
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tópicos do Tutorial</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Primeiros Passos</h4>
              <p className="text-sm text-muted-foreground">Configuração inicial e navegação básica</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Gerenciamento de Pacientes</h4>
              <p className="text-sm text-muted-foreground">Como adicionar e gerenciar seus pacientes</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Agendamentos</h4>
              <p className="text-sm text-muted-foreground">Sistema de agendamento e calendário</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Relatórios e Análises</h4>
              <p className="text-sm text-muted-foreground">Como acessar e interpretar seus dados</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
