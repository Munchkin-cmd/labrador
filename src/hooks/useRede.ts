import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

type RpcResult = { success: boolean; message?: string; error?: string }

export function useRede() {
  const countryId = useAuthStore(state => state.country?.id)
  const [loading, setLoading]     = useState(true)
  const [regions, setRegions]     = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [catalog, setCatalog]     = useState<any[]>([])
  const [economy, setEconomy]     = useState<any>(null)
  const fetchedRef = useRef(false)

  const fetchAll = useCallback(async () => {
    if (!countryId) return
    setLoading(true)

    const [r, b, c, e] = await Promise.all([
      supabase.from('regions').select('*').eq('country_id', countryId),
      supabase.from('buildings')
        .select('*, building_catalog(*)')
        .eq('country_id', countryId),
      supabase.from('building_catalog').select('*'),
      supabase.from('economy').select('*').eq('country_id', countryId).single(),
    ])

    setRegions(r.data ?? [])
    setBuildings(b.data ?? [])
    setCatalog(c.data ?? [])
    setEconomy(e.data)
    setLoading(false)
  }, [countryId])

  useEffect(() => {
    if (!countryId) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchAll()
  }, [countryId, fetchAll])

  async function build(regionId: string, buildingType: string, quantity: number): Promise<RpcResult> {
    if (!countryId) return { success: false, error: 'País não encontrado' }
    const { data, error } = await supabase.rpc('construct_building', {
      p_country_id:    countryId,
      p_region_id:     regionId,
      p_building_type: buildingType,
      p_quantity:      quantity,
    })
    if (error) return { success: false, error: error.message }
    fetchedRef.current = false
    await fetchAll()
    return (data as RpcResult) ?? { success: false, error: 'Erro desconhecido' }
  }

  async function produceEquipment(equipType: string, quantity: number): Promise<RpcResult> {
    if (!countryId) return { success: false, error: 'País não encontrado' }
    const { data, error } = await supabase.rpc('produce_equipment', {
      p_country_id: countryId,
      p_equip_type: equipType,
      p_quantity:   quantity,
    })
    if (error) return { success: false, error: error.message }
    fetchedRef.current = false
    await fetchAll()
    return (data as RpcResult) ?? { success: false, error: 'Erro desconhecido' }
  }

  // ✅ AGORA MEMORIZADO: refetch não muda a cada renderização
  const refetch = useCallback(() => {
    fetchedRef.current = false
    fetchAll()
  }, [fetchAll])

  return {
    regions, buildings, catalog, economy, loading,
    build, produceEquipment,
    refetch,
  }
}