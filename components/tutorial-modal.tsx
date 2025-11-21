"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PlayCircle, XCircle } from "lucide-react"
import { TUTORIAL_VIDEO_URL } from "@/lib/tutorial-config"

function getEmbedUrl(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
  } catch (e) {}
  return url
}

interface TutorialModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TutorialModal({ open, onOpenChange }: TutorialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Bem-vindo ao ViraWeb!</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Card className="relative p-6 overflow-hidden bg-gradient-to-br from-primary/5 to-background">
            <div className="flex items-center justify-center min-h-[200px] mb-4">
              {TUTORIAL_VIDEO_URL ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={getEmbedUrl(TUTORIAL_VIDEO_URL)}
                    className="w-full h-full"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Tutorial ViraWeb"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <PlayCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">Tutorial em breve!</h3>
                  <p className="text-muted-foreground">
                    Estamos preparando um vídeo tutorial completo para ajudá-lo a aproveitar ao máximo nossa plataforma.
                    Em breve você poderá assistir aqui mesmo!
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Entendi
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
