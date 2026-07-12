import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export interface Parliament {
  id: string
  country_id: number
  coalition_seats: number
  opposition_seats: number
  total_seats: number
  last_election_at: string
  last_random_at: string
  election_type: 'trust' | 'random'
  updated_at: string
}

export interface Law {
  id: string
  country_id: number
  law_catalog_id: number
  votes_for: number
  votes_against: number
  status: 'pending' | 'active' | 'revoked'
  approved_at: string | null
  revoked_at: string | null
  voting_deadline: string | null
  forced_approval: boolean
  created_at: string
  target_id?: number | null        // ID do país ou região alvo
  target_type?: string | null      // 'country', 'region', 'text'
  target_text?: string | null      // Para mudar nome do país
  law_catalog: {
    name: string
    description: string
    political_power_cost: number
  } | null
}

export interface LawCatalog {
  id: number
  name: string
  description: string
  requires_parliament: boolean
  political_power_cost: number
}

export function useParliament() {
  const { country } = useAuthStore()
  const [parliament, setParliament] = useState<Parliament | null>(null)
  const [laws, setLaws]             = useState<Law[]>([])
  const [catalog, setCatalog]       = useState<LawCatalog[]>([])
  const [loading, setLoading]       = useState(true)
  const [countdown, setCountdown]   = useState<Record<string, number>>({})

  useEffect(() => {
    if (!country?.id) return
    fetchAll()

    const channel = supabase
      .channel('parliament_laws')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'laws', filter: `country_id=eq.${country.id}` },
        () => fetchAll()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'parliament', filter: `country_id=eq.${country.id}` },
        () => fetchAll()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [country?.id])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const updated: Record<string, number> = {}
      laws.forEach(law => {
        if (law.status === 'pending' && law.voting_deadline) {
          const remaining = Math.max(0, new Date(law.voting_deadline).getTime() - now)
          updated[law.id] = remaining
        }
      })
      setCountdown(updated)
    }, 1000)
    return () => clearInterval(timer)
  }, [laws])

  async function fetchAll() {
    if (!country?.id) return
    setLoading(true)

    const [p, l, c] = await Promise.all([
      supabase
        .from('parliament')
        .select('id, country_id, coalition_seats, opposition_seats, total_seats, last_election_at, last_random_at, election_type, updated_at')
        .eq('country_id', country.id)
        .single(),

      supabase
        .from('laws')
        .select(`
          id, country_id, law_catalog_id, votes_for, votes_against,
          status, approved_at, revoked_at, voting_deadline, forced_approval, created_at,
          target_id, target_type, target_text,
          law_catalog(name, description, political_power_cost)
        `)
        .eq('country_id', country.id)
        .order('created_at', { ascending: false })
        .limit(30),

      supabase
        .from('law_catalog')
        .select('id, name, description, requires_parliament, political_power_cost')
        .order('id'),
    ])

    if (p.data)  setParliament(p.data as Parliament)
    if (l.data)  setLaws(l.data as unknown as Law[])
    if (c.data)  setCatalog(c.data as LawCatalog[])
    setLoading(false)
  }

  async function proposeLaw(
    lawCatalogId: number,
    target?: {
      countryId?: number
      regionId?: string
      text?: string
    }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!country?.id) return { success: false, error: 'País não encontrado' }

    const { data, error } = await supabase.rpc('propose_law', {
      p_country_id:     country.id,
      p_law_catalog_id: lawCatalogId,
      p_target_id:      target?.countryId || target?.regionId || null,
      p_target_type:    target?.countryId ? 'country' : target?.regionId ? 'region' : target?.text ? 'text' : null,
      p_target_text:    target?.text || null,
    })

    if (error) return { success: false, error: error.message }
    await fetchAll()
    return data as { success: boolean; message?: string; error?: string }
  }

  async function forceLaw(lawId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!country?.id) return { success: false, error: 'País não encontrado' }
    const { data, error } = await supabase.rpc('force_law_approval', {
      p_country_id: country.id,
      p_law_id:     lawId,
    })
    if (error) return { success: false, error: error.message }
    await fetchAll()
    return data as { success: boolean; message?: string; error?: string }
  }

  function nextElectionIn(): string {
    if (!parliament) return '—'
    const last = new Date(parliament.last_election_at).getTime()
    const next = last + (12 * 60 * 60 * 1000)
    const diff = Math.max(0, next - Date.now())
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  function nextRandomIn(): string {
    if (!parliament) return '—'
    const last = new Date(parliament.last_random_at).getTime()
    const next = last + (48 * 60 * 60 * 1000)
    const diff = Math.max(0, next - Date.now())
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  function formatCountdown(lawId: string): string {
    const ms = countdown[lawId]
    if (ms === undefined) return '—'
    if (ms === 0) return 'Votando...'
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return {
    parliament,
    laws,
    catalog,
    loading,
    proposeLaw,
    forceLaw,
    nextElectionIn,
    nextRandomIn,
    formatCountdown,
    refetch: fetchAll,
  }
}