import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

interface CountrySummary {
  id: number
  name: string
  flag_emoji: string
}

interface AuthState {
  user: { id: string; email: string } | null
  country: CountrySummary | null
  loading: boolean
  setUser: (user: AuthState['user']) => void
  setCountry: (country: CountrySummary) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  country: null,
  loading: true,

  setUser:    (user)    => set({ user, loading: false }),
  // src/store/authStore.ts
setCountry: (country) => set({ country, loading: false }),  // ✅ Seta loading false

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, country: null })
  },
}))
