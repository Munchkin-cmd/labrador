// Hooks compartilhados pelas páginas do menu lateral
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// ── ARMAZÉM + ORÇAMENTO ──────────────────────────────────────
export function useEconomy() {
  const { country } = useAuthStore()
  const [economy, setEconomy] = useState<any>(null)
  const [military, setMilitary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!country?.id) return
    setLoading(true)
    const [e, m] = await Promise.all([
      supabase.from('economy').select('*').eq('country_id', country.id).single(),
      supabase.from('military').select('*').eq('country_id', country.id).single(),
    ])
    setEconomy(e.data)
    setMilitary(m.data)
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { economy, military, loading, refetch: fetchData }
}

// ── BRIEFING ──────────────────────────────────────────────────
export function useBriefing() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInitial = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    fetchInitial()

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new.user_id === user.id) {
            setNotifications(prev => [payload.new, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, fetchInitial])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      console.error('Erro ao marcar como lida:', error)
      fetchInitial()
    }
  }, [fetchInitial])

  const markAllRead = useCallback(async () => {
    if (!user?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      fetchInitial()
    }
  }, [user?.id, fetchInitial])

  return { notifications, loading, markRead, markAllRead, refetch: fetchInitial }
}

// ── MERCADO ──────────────────────────────────────────────────
export function useMarket() {
  const { country } = useAuthStore()
  const [offers, setOffers] = useState<any[]>([])
  const [myOffers, setMyOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!country?.id) return
    const [all, mine] = await Promise.all([
      supabase.from('market')
        .select('*, countries(name, flag_emoji)')
        .in('status', ['open', 'partial'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('market')
        .select('*')
        .eq('country_id', country!.id)
        .in('status', ['open', 'partial'])
        .order('created_at', { ascending: false }),
    ])
    setOffers(all.data ?? [])
    setMyOffers(mine.data ?? [])
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    if (!country?.id) return
    fetchAll()

    const channel = supabase.channel('market_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market' },
        () => fetchAll()
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [country?.id, fetchAll])

  async function placeOrder(resource: string, type: string, qty: number, price: number) {
    const { data } = await supabase.rpc('place_market_order', {
      p_country_id: country!.id,
      p_resource: resource,
      p_order_type: type,
      p_quantity: qty,
      p_price: price,
    })
    await fetchAll()
    return data
  }

  async function buyOffer(orderId: string, qty: number) {
    const { data } = await supabase.rpc('execute_market_transaction', {
      p_order_id: orderId,
      p_buyer_id: country!.id,
      p_quantity: qty,
    })
    await fetchAll()
    return data
  }

  return { offers, myOffers, loading, placeOrder, buyOffer }
}

// ── TAXES (CORRIGIDO COM `as any` E `updated_at`) ────────────
export function useTaxes() {
  const { country } = useAuthStore()
  const [taxes, setTaxes] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchTaxes = useCallback(async () => {
    if (!country?.id) return
    setLoading(true)
    const { data } = await supabase.from('taxes').select('*').eq('country_id', country.id).single()
    setTaxes(data)
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    fetchTaxes()
  }, [fetchTaxes])

  async function saveTaxes(updated: any) {
    setSaving(true)

    // ✅ Verifica se o país existe
    if (!country) {
      setSaving(false)
      return { success: false, error: 'Você precisa estar logado em um país' }
    }

    // 1. Prepara os dados para atualização
    const updateData = {
      income_tax: Number(updated.income_tax) || 0,
      corporate_tax: Number(updated.corporate_tax) || 0,
      property_tax: Number(updated.property_tax) || 0,
      manufacturing_tax: Number(updated.manufacturing_tax) || 0,
      vat: Number(updated.vat) || 0,
      customs: Number(updated.customs) || 0,
      updated_at: new Date().toISOString(),
    }

    // 2. Executa o update no Supabase (AS ANY resolve o erro de tipo)
    const { error: taxError } = await supabase
      .from('taxes')
      .update(updateData as any) // ✅ Força o TypeScript a aceitar o objeto
      .eq('country_id', country.id)

    if (taxError) {
      console.error('❌ Erro no update de impostos:', taxError)
      setSaving(false)
      return { success: false, error: taxError.message }
    }

    // 3. Se o update for bem-sucedido, aplica as penalidades de confiança e aprovação
    const taxFields = ['income_tax', 'corporate_tax', 'property_tax', 'manufacturing_tax', 'vat', 'customs']
    const totalTax = taxFields.reduce((sum, key) => sum + (Number(updated[key] ?? 0)), 0)
    const avgTax = totalTax / taxFields.length

    const trustPenalty = avgTax > 40 ? (avgTax - 40) * 0.5 : 0
    const approvalPenalty = avgTax > 50 ? (avgTax - 50) * 0.5 : 0

    // Busca os valores atuais de trust e approval
    const { data: currentCountry, error: fetchError } = await supabase
      .from('countries')
      .select('trust, intl_approval')
      .eq('id', country.id)
      .single()

    if (fetchError) {
      console.warn('⚠️ Não foi possível buscar dados do país:', fetchError)
    } else if (currentCountry) {
      const newTrust = Math.max(0, (currentCountry.trust || 50) - trustPenalty)
      const newApproval = Math.max(0, (currentCountry.intl_approval || 50) - approvalPenalty)

      await supabase
        .from('countries')
        .update({ trust: newTrust, intl_approval: newApproval })
        .eq('id', country.id)
    }

    // ✅ Atualiza o estado local
    setTaxes((prev: any) => ({ ...prev, ...updateData }))
    setSaving(false)
    return { success: true }
  }

  return { taxes, loading, saving, saveTaxes }
}

// ── CONFIGURAÇÕES ────────────────────────────────────────────
export function useConfiguracoes() {
  const { country } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!country?.id) return
    setLoading(true)
    const [c, u] = await Promise.all([
      supabase.from('countries').select('*').eq('id', country.id).single(),
      supabase.from('users').select('flag_url, leader_url, banner_urls').eq('country_id', country.id).single(),
    ])
    setData(c.data)
    setProfile(u.data)
    setLoading(false)
  }, [country?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function saveCountry(fields: any) {
    setSaving(true)
    const { error } = await supabase.from('countries').update(fields).eq('id', country!.id)
    if (!error) setData((prev: any) => ({ ...prev, ...fields }))
    setSaving(false)
    return { success: !error }
  }

  async function saveProfile(fields: any) {
    setSaving(true)
    const { error } = await supabase.from('users').update(fields).eq('country_id', country!.id)
    if (!error) setProfile((prev: any) => ({ ...prev, ...fields }))
    setSaving(false)
    return { success: !error }
  }

  return { data, profile, loading, saving, saveCountry, saveProfile }
}