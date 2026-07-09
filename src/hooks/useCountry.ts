import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export interface CountryFull {
  id: number
  name: string
  flag_emoji: string
  capital: string
  terrain: string
  motto: string | null
  leader_name: string | null
  leader_title: string
  state_structure: string
  religion: string
  currency: string
  language: string // ✅ Já adicionado
  trust: number
  intl_approval: number
  political_power: number
  total_regions: number
  flag_url?: string | null
  is_active: boolean // ✅ ADICIONADO: Agora o TypeScript sabe que isso existe
}

export interface Economy {
  money: number
  food: number
  gold: number
  iron: number
  oil: number
  wood: number
  uranium: number
  coal: number
  steel: number
  energy: number
  population: number
  pollution: number
  inflation: number
  exports: number
  imports: number
  revenue?: number
  expenses?: number
}

export interface UserProfile {
  flag_url: string | null
  leader_url: string | null
  banner_urls: string[]
}

export function useCountry() {
  const { country } = useAuthStore()
  const [data, setData] = useState<CountryFull | null>(null)
  const [economy, setEconomy] = useState<Economy | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ Memoizar fetchAll com useCallback para evitar loop infinito
  const fetchAll = useCallback(async () => {
    if (!country?.id) return
    
    setLoading(true)

    const c = await supabase
      .from('countries')
      .select('*')
      .eq('id', country.id)
      .single<CountryFull>()

    const e = await supabase
      .from('economy')
      .select('*')
      .eq('country_id', country.id)
      .single<Economy>()

    const u = await supabase
      .from('users')
      .select('flag_url, leader_url, banner_urls')
      .eq('country_id', country.id)
      .single<UserProfile>()

    if (c.data) setData(c.data)
    if (e.data) setEconomy(e.data)
    if (u.data) setProfile(u.data)
    
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    if (!country?.id) return
    fetchAll()
  }, [country?.id, fetchAll])

  return { data, economy, profile, loading, refetch: fetchAll }
}