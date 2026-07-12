import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// Tipos de retorno para as funções RPC
type RpcBuildResult = {
  success: boolean
  message?: string
  error?: string
}

type RpcProduceResult = {
  success: boolean
  message?: string
  error?: string
}

export function useRede() {
  const { country } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [economy, setEconomy] = useState<any>(null)

  // ✅ MEMOIZAÇÃO: useCallback garante que a função fetchAll não mude a cada renderização
  const fetchAll = useCallback(async () => {
    if (!country?.id) return
    setLoading(true)
    
    const [r, b, c, e] = await Promise.all([
      supabase.from('regions').select('*').eq('country_id', country!.id),
      supabase.from('buildings')
        .select('*, building_catalog(*)')
        .eq('country_id', country!.id),
      supabase.from('building_catalog').select('*'),
      supabase.from('economy').select('*').eq('country_id', country!.id).single(),
    ])

    setRegions(r.data ?? [])
    setBuildings(b.data ?? [])
    setCatalog(c.data ?? [])
    setEconomy(e.data)
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    if (!country?.id) return
    fetchAll()
  }, [country?.id, fetchAll]) // ✅ Dependência correta (não causa loop)

  // ─── CONSTRUIR EDIFÍCIO ──────────────────────────────────────
  async function build(regionId: string, buildingType: string, quantity: number): Promise<RpcBuildResult> {
    if (!country?.id) return { success: false, error: 'País não encontrado' }
    
    const { data, error } = await supabase
      .rpc('construct_building', {
        p_country_id: country!.id,
        p_region_id: regionId,
        p_building_type: buildingType,
        p_quantity: quantity,
      }) as { data: RpcBuildResult | null; error: any }

    if (error) return { success: false, error: error.message }
    await fetchAll()
    return data ?? { success: false, error: 'Erro desconhecido' }
  }

  // ─── PRODUZIR EQUIPAMENTO MILITAR ───────────────────────────
  async function produceEquipment(equipType: string, quantity: number): Promise<RpcProduceResult> {
    if (!country?.id) return { success: false, error: 'País não encontrado' }
    
    const { data, error } = await supabase
      .rpc('produce_equipment', {
        p_country_id: country!.id,
        p_equip_type: equipType,
        p_quantity: quantity,
      }) as { data: RpcProduceResult | null; error: any }

    if (error) return { success: false, error: error.message }
    await fetchAll()
    return data ?? { success: false, error: 'Erro desconhecido' }
  }

  return {
    regions,
    buildings,
    catalog,
    economy,
    loading,
    build,
    produceEquipment,
    refetch: fetchAll, // ✅ Agora é uma função estável
  }
}