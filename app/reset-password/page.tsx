'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Captura o token apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Pega o path completo da URL
      const pathname = window.location.pathname
      console.log('URL Path:', pathname)

      // Verifica se o token está na URL
      if (pathname.includes('access_token=')) {
        const token = pathname
          .split('access_token=')[1]
          ?.split('&')[0] // Pega o token até o próximo & se existir
          
        console.log('Token encontrado:', token ? 'Sim' : 'Não')

        if (token) {
          setRecoveryToken(token)
          // Limpa a URL para não deixar o token exposto
          window.history.replaceState({}, '', '/reset-password')
        } else {
          console.error('Token não encontrado na URL')
          toast({
            title: "Erro de Autenticação",
            description: "Link de recuperação inválido. Solicite um novo link.",
            variant: "destructive",
          })
          router.push('/')
        }
      } else {
        // Se não há token na URL e também não há token salvo, redireciona
        if (!recoveryToken) {
          console.error('URL não contém access_token')
          toast({
            title: "Link Inválido",
            description: "O link de recuperação está incompleto. Solicite um novo link.",
            variant: "destructive",
          })
          router.push('/')
        }
      }
      setIsInitializing(false)
    }
  }, [router, toast, recoveryToken])

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "" }
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++

    const labels = ["Fraca", "Fraca", "Média", "Forte", "Muito Forte"]
    return { strength, label: labels[strength] }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recoveryToken) {
      toast({
        title: "Link inválido",
        description: "O link de redefinição de senha é inválido ou expirou.",
        variant: "destructive",
      })
      return
    }

    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    const passwordStrength = getPasswordStrength(password)
    if (passwordStrength.strength < 3) {
      toast({
        title: "Senha fraca",
        description: "Por favor, escolha uma senha mais forte.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (!recoveryToken) throw new Error('Token de recuperação não encontrado.')
      
      // Primeiro, configura a sessão com o token de recuperação
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryToken,
        refresh_token: ''
      })
      
      if (sessionError) {
        console.error('Erro na sessão:', sessionError)
        throw new Error('Link de recuperação inválido ou expirado')
      }

      // Depois atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        console.error('Erro ao atualizar:', updateError)
        throw new Error(updateError.message || 'Erro ao redefinir senha')
      }

      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso.",
      })
      router.push('/')
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    isInitializing ? (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando link de recuperação...</p>
        </div>
      </div>
    ) : (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className=" w-20 flex items-center justify-center mb-4">
                     <Image width={214} height={191} alt='' className='' src="/viraweb7.png" />
                    </div>
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-gray-600 text-center mt-2">
            Digite sua nova senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nova senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {password && (
              <div className="mt-1">
                <div className="text-xs text-gray-600">Força da senha: {passwordStrength.label}</div>
                <div className="h-1 w-full bg-gray-200 rounded-full mt-1">
                  <div
                    className={`h-1 rounded-full transition-all ${
                      passwordStrength.strength <= 1
                        ? 'bg-red-500'
                        : passwordStrength.strength === 2
                        ? 'bg-yellow-500'
                        : passwordStrength.strength >= 3
                        ? 'bg-green-500'
                        : ''
                    }`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirme a nova senha
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <Lock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Redefinindo..." : "Redefinir senha"}
          </Button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-primary cursor-pointer text-sm"
            >
              Voltar para login
            </button>
          </div>
        </form>

        <p className="mt-8 text-xs text-center text-gray-500">
          Seus dados estão seguros e protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
    )
  )
}