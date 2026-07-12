import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

type RpcResult = { success: boolean; message?: string; error?: string }

export function useRede() {
  const countryId = useAuthStore(state => state.country?.id) // ✅ Pega só o ID, não o objeto inteiro
  const [loading, setLoading]     = useState(true)
  const [regions, setRegions]     = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [catalog, setCatalog]     = useState<any[]>([])
  const [economy, setEconomy]     = useState<any>(null)
  const fetchedRef = useRef(false) // ✅ Evita dupla chamada no StrictMode

  async function fetchAll() {
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
  }

  useEffect(() => {
    if (!countryId) return
    if (fetchedRef.current) return // ✅ Não busca duas vezes
    fetchedRef.current = true
    fetchAll()
  }, [countryId]) // ✅ Depende só do ID primitivo, não do objeto

  async function build(regionId: string, buildingType: string, quantity: number): Promise<RpcResult> {
    if (!countryId) return { success: false, error: 'País não encontrado' }
    const { data, error } = await supabase.rpc('construct_building', {
      p_country_id:    countryId,
      p_region_id:     regionId,
      p_building_type: buildingType,
      p_quantity:      quantity,
    })
    if (error) return { success: false, error: error.message }
    fetchedRef.current = false // ✅ Permite refetch após ação
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

  return {
    regions, buildings, catalog, economy, loading,
    build, produceEquipment,
    refetch: () => { fetchedRef.current = false; fetchAll() },
  }
}


