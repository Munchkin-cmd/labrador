import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface WorldStats {
  total_countries: number
  active_countries: number
  total_regions: number
  total_buildings: number
  total_money: number
  total_population: number
}

export function useWorldStats() {
  const [stats, setStats] = useState<WorldStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const [countries, regions, buildings, economy] = await Promise.all([
      supabase.from('countries').select('id, is_active, total_regions'),
      supabase.from('regions').select('id'),
      supabase.from('buildings').select('quantity').eq('is_active', true).eq('is_built', true),
      supabase.from('economy').select('money, population'),
    ])

    const totalMoney = (economy.data ?? []).reduce((s, e) => s + Number(e.money), 0)
    const totalPop   = (economy.data ?? []).reduce((s, e) => s + Number(e.population), 0)
    const totalBuildings = (buildings.data ?? []).reduce((s, b) => s + b.quantity, 0)

    setStats({
      total_countries:  (countries.data ?? []).length,
      active_countries: (countries.data ?? []).filter(c => c.is_active).length,
      total_regions:    (regions.data ?? []).length,
      total_buildings:  totalBuildings,
      total_money:      totalMoney,
      total_population: totalPop,
    })
    setLoading(false)
  }

  return { stats, loading }
}
