// Hooks compartilhados pelas páginas do menu lateral
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

// ── ARMAZÉM + ORÇAMENTO ──────────────────────────────────────
export function useEconomy() {
  const { country } = useAuthStore()
  const [economy, setEconomy] = useState<any>(null)
  const [military, setMilitary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!country?.id) return
    Promise.all([
      supabase.from('economy').select('*').eq('country_id', country.id).single(),
      supabase.from('military').select('*').eq('country_id', country.id).single(),
    ]).then(([e, m]) => {
      setEconomy(e.data)
      setMilitary(m.data)
      setLoading(false)
    })
  }, [country?.id])

  return { economy, military, loading }
}

// ── BRIEFING ──────────────────────────────────────────────────
export function useBriefing() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInitial = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

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
  }, [user?.id])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return { notifications, loading, markRead, markAllRead }
}

// ── MERCADO ──────────────────────────────────────────────────
export function useMarket() {
  const { country } = useAuthStore()
  const [offers, setOffers] = useState<any[]>([])
  const [myOffers, setMyOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!country?.id) return
    fetchAll()

    const channel = supabase.channel('market_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market' },
        () => fetchAll()
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [country?.id])

  async function fetchAll() {
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
  }

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

// ── TAXES ────────────────────────────────────────────────────
export function useTaxes() {
  const { country } = useAuthStore()
  const [taxes, setTaxes] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!country?.id) return
    supabase.from('taxes').select('*').eq('country_id', country.id).single()
      .then(({ data }) => { setTaxes(data); setLoading(false) })
  }, [country?.id])

  async function saveTaxes(updated: any) {
    setSaving(true)

    // ✅ 1. Salva os novos impostos na tabela taxes
    const { error: taxError } = await supabase.from('taxes')
      .update({ ...updated, last_updated: new Date().toISOString() })
      .eq('country_id', country!.id)

    if (taxError) {
      setSaving(false)
      return { success: false }
    }

    // 2. Calcula a carga tributária média
    const taxFields = ['income_tax', 'corporate_tax', 'property_tax', 'manufacturing_tax', 'vat', 'customs']
    const totalTax = taxFields.reduce((sum, key) => sum + (Number(updated[key] ?? 0)), 0)
    const avgTax = totalTax / taxFields.length

    // 3. Aplica penalidades de confiança e aprovação
    const trustPenalty = avgTax > 40 ? (avgTax - 40) * 0.5 : 0
    const approvalPenalty = avgTax > 50 ? (avgTax - 50) * 0.5 : 0

    const { data: currentCountry } = await supabase
      .from('countries')
      .select('trust, intl_approval')
      .eq('id', country!.id)
      .single()

    if (currentCountry) {
      const newTrust = Math.max(0, (currentCountry.trust || 50) - trustPenalty)
      const newApproval = Math.max(0, (currentCountry.intl_approval || 50) - approvalPenalty)

      await supabase
        .from('countries')
        .update({ trust: newTrust, intl_approval: newApproval })
        .eq('id', country!.id)
    }

    setTaxes((prev: any) => ({ ...prev, ...updated }))
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

  useEffect(() => {
    if (!country?.id) return
    Promise.all([
      supabase.from('countries').select('*').eq('id', country.id).single(),
      supabase.from('users').select('flag_url, leader_url, banner_urls').eq('country_id', country.id).single(),
    ]).then(([c, u]) => {
      setData(c.data)
      setProfile(u.data)
      setLoading(false)
    })
  }, [country?.id])

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