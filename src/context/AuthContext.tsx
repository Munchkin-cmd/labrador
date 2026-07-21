'use client'

import { createContext, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! })
          await fetchCountry(session.user.id)

          if (pathname === '/game/home') {
            router.refresh()
          }
        } else {
          useAuthStore.setState({ loading: false })
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err)
        useAuthStore.setState({ loading: false })
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! })
          await fetchCountry(session.user.id)
          if (pathname === '/game/home') {
            router.refresh()
          }
        } else {
          useAuthStore.setState({ user: null, country: null, loading: false })
        }
      } catch (err) {
        console.error('Erro no auth state change:', err)
        useAuthStore.setState({ loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router, setUser, setCountry])

  async function fetchCountry(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('country_id, countries!country_id ( id, name, flag_emoji )')
        .eq('user_id', userId)
        .single<UserWithCountry>()

      if (error) {
        console.error('Erro ao buscar país:', error)
        useAuthStore.setState({ loading: false })
        return
      }

      if (data?.countries) {
        const c = data.countries
        setCountry({ id: c.id, name: c.name, flag_emoji: c.flag_emoji })
      }
      
      useAuthStore.setState({ loading: false })
    } catch (err) {
      console.error('Erro inesperado ao buscar país:', err)
      useAuthStore.setState({ loading: false })
    }
  }

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}