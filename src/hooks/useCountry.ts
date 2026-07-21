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
  language: string
  trust: number
  intl_approval: number
  political_power: number
  total_regions: number
  flag_url?: string | null
  is_active: boolean
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
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!country?.id) return
    
    setLoading(true)
    setError(null)

    try {
      const { data: result, error: err } = await supabase
        .from('countries')
        .select(`
          *,
          economy(*),
          users(flag_url, leader_url, banner_urls)
        `)
        .eq('id', country.id)
        .single<CountryFull & { economy: Economy; users: UserProfile }>()

      if (err) {
        console.error('Erro ao buscar dados do país:', err)
        setError(err.message)
        setLoading(false)
        return
      }

      if (result) {
        setData(result)
        setEconomy(result.economy)
        setProfile(result.users)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Erro inesperado:', err)
      setError('Erro ao carregar dados')
      setLoading(false)
    }
  }, [country?.id])

  useEffect(() => {
    if (!country?.id) return
    fetchAll()
  }, [country?.id, fetchAll])

  return { 
    data, 
    economy, 
    profile, 
    loading, 
    error,
    refetch: fetchAll 
  }
}