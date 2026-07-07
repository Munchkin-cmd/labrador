'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    // 1. Faz o login normal com Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !data.session) {
      setError('Email ou senha inválidos.')
      setLoading(false)
      return
    }

    // 2. Verifica se o usuário tem role = 'admin' na tabela users
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', data.session.user.id)
      .single()

    if (roleError || userData?.role !== 'admin') {
      // Se não for admin, faz logout e bloqueia
      await supabase.auth.signOut()
      setError('Acesso restrito. Você não é administrador.')
      setLoading(false)
      return
    }

    // 3. Tudo certo! Vai para o dashboard
    router.push('/admin/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-light flex items-center justify-center gap-2">
            <span className="text-2xl">🛡️</span> Painel Admin
          </h1>
          <p className="text-white/40 text-sm mt-1">Acesso exclusivo para administradores</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email do Admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando...' : '🔐 Acessar Painel'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/game/home" className="text-white/40 text-sm hover:text-white transition-colors">
            ← Voltar para o Jogo
          </Link>
        </div>

      </div>
    </div>
  )
}