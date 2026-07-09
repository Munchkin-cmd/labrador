import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export interface War {
  id: string
  attacker_id: number
  defender_id: number
  status: string
  terrain: string
  started_at: string
  attacker: { 
    name: string
    flag_emoji: string
  }
  defender: { 
    name: string
    flag_emoji: string
  }
}

export interface Training {
  id: string
  equipment_type: string
  quantity: number
  quality_before: number
  quality_after: number
  progress: number
  status: string
  start_date: string
  end_date: string
}

// ─── TIPOS DE RETORNO DAS RPCS ──────────────────────────────
type RpcAttackResult = {
  success: boolean
  damage_dealt: number
  losses_suffered: number
  error?: string
}

type RpcTrainingResult = {
  success: boolean
  message?: string
  error?: string
}

type RpcSimpleResult = {
  success: boolean
  message?: string
  error?: string
}

export function useWar() {
  const { country } = useAuthStore()
  const [myWars, setMyWars]       = useState<War[]>([])
  const [worldWars, setWorldWars] = useState<War[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [military, setMilitary]   = useState<any>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!country?.id) return
    fetchAll()
  }, [country?.id])

  async function fetchAll() {
    setLoading(true)
    
    // ✅ Fetch wars sem join (evita erro 400)
    const [w, ww, t, m, attackerCountries, defenderCountries] = await Promise.all([
      supabase.from('wars')
        .select('id, attacker_id, defender_id, status, terrain, started_at')
        .or(`attacker_id.eq.${country!.id},defender_id.eq.${country!.id}`)
        .in('status', ['active','ceasefire']),
      
      supabase.from('wars')
        .select('id, attacker_id, defender_id, status, terrain, started_at')
        .in('status', ['active','ceasefire'])
        .order('started_at', { ascending: false })
        .limit(20),
      
      supabase.from('military_training')
        .select('*')
        .eq('country_id', country!.id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      supabase.from('military')
        .select('*')
        .eq('country_id', country!.id)
        .single(),
      
      // Buscar todos os países (para cache)
      supabase.from('countries')
        .select('id, name, flag_emoji'),
      
      supabase.from('countries')
        .select('id, name, flag_emoji'),
    ])

    // ✅ Enriquecer wars com dados de países
    const countryMap = new Map()
    ;[...((attackerCountries.data ?? []) as any[]), ...((defenderCountries.data ?? []) as any[])].forEach((c: any) => {
      countryMap.set(c.id, { name: c.name, flag_emoji: c.flag_emoji })
    })

    const enrichWars = (wars: any[]) => wars.map((war: any) => ({
      ...war,
      attacker: countryMap.get(war.attacker_id) ?? { name: 'Desconhecido', flag_emoji: '🌐' },
      defender: countryMap.get(war.defender_id) ?? { name: 'Desconhecido', flag_emoji: '🌐' },
    }))

    setMyWars(enrichWars(w.data ?? []))
    setWorldWars(enrichWars(ww.data ?? []))
    setTrainings(t.data ?? [])
    setMilitary(m.data)
    setLoading(false)
  }

  async function startTraining(equipType: string, quantity: number): Promise<RpcTrainingResult> {
    const { data, error } = await supabase
      .rpc('start_military_training', {
        p_country_id:  country!.id,
        p_equip_type:  equipType,
        p_quantity:    quantity,
      }) as { data: RpcTrainingResult | null; error: any }

    await fetchAll()
    if (error) return { success: false, error: error.message }
    return data ?? { success: false, error: 'Erro desconhecido' }
  }

  async function declareWar(targetId: number): Promise<RpcSimpleResult> {
    const { data, error } = await supabase
      .rpc('declare_war', {
        p_attacker_id: country!.id,
        p_defender_id: targetId,
      }) as { data: RpcSimpleResult | null; error: any }

    await fetchAll()
    if (error) return { success: false, error: error.message }
    return data ?? { success: false, error: 'Erro desconhecido' }
  }

  async function attack(warId: string, unitType: string, quantity: number): Promise<RpcAttackResult> {
    const { data, error } = await supabase
      .rpc('attack', {
        p_war_id:      warId,
        p_attacker_id: country!.id,
        p_unit_type:   unitType,
        p_quantity:    quantity,
      }) as { data: RpcAttackResult | null; error: any }

    if (error) return { success: false, error: error.message, damage_dealt: 0, losses_suffered: 0 }
    return data ?? { success: false, error: 'Erro desconhecido', damage_dealt: 0, losses_suffered: 0 }
  }

  async function proposePeace(warId: string): Promise<RpcSimpleResult> {
    const { data, error } = await supabase
      .rpc('propose_peace', {
        p_war_id:     warId,
        p_country_id: country!.id,
      }) as { data: RpcSimpleResult | null; error: any }

    await fetchAll()
    if (error) return { success: false, error: error.message }
    return data ?? { success: false, error: 'Erro desconhecido' }
  }

  return {
    myWars, worldWars, trainings, military, loading,
    startTraining, declareWar, attack, proposePeace,
    refetch: fetchAll,
  }
}