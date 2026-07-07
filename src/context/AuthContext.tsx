'use client'

import { createContext, useContext, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// ✅ Interface local para o retorno da consulta (sem depender do database.ts)
interface UserWithCountry {
  country_id: number | null
  countries: {
    id: number
    name: string
    flag_emoji: string
  } | null
}

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setCountry } = useAuthStore()

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        await fetchCountry(session.user.id)

        // ✅ Se estiver na home, força a revalidação da sessão no servidor
        if (pathname === '/game/home') {
          router.refresh()
        }
      } else {
        useAuthStore.setState({ loading: false })
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
        fetchCountry(session.user.id)
        if (pathname === '/game/home') {
          router.refresh()
        }
      } else {
        useAuthStore.setState({ user: null, country: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, setUser])

  async function fetchCountry(userId: string) {
    // ✅ Consulta com tipagem local (sem depender do Database)
    const { data } = await supabase
      .from('users')
      .select('country_id, countries ( id, name, flag_emoji )')
      .eq('user_id', userId)
      .single() as unknown as { data: UserWithCountry | null }

    if (data?.countries) {
      const c = data.countries
      setCountry({ id: c.id, name: c.name, flag_emoji: c.flag_emoji })
    } else {
      useAuthStore.setState({ loading: false })
    }
  }

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}