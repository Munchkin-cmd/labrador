import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Verifica se o usuário está logado
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Verifica se o usuário é admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // 3. Pega a ação e os parâmetros enviados pelo front-end
  const { action, params } = await request.json()

  // 4. Roteia a ação para a função RPC correta
  let result
  switch (action) {
    case 'resetWorld':
      result = await supabase.rpc('admin_reset_world')
      break
    case 'toggleNpcCycle':
      result = await supabase.rpc('admin_toggle_npc_cycle')
      break
    case 'forceNpcCycle':
      result = await supabase.rpc('admin_force_npc_cycle')
      break
    case 'toggleCountry':
      result = await supabase.rpc('admin_toggle_country', { p_country_id: params.countryId })
      break
    case 'deleteRegion':
      result = await supabase.rpc('admin_delete_region', { p_region_id: params.regionId })
      break
    case 'endWar':
      result = await supabase.rpc('admin_end_war', { p_war_id: params.warId })
      break
    case 'sendAnnouncement':
      result = await supabase.rpc('admin_send_global_announcement', { 
        p_title: params.title, 
        p_message: params.message 
      })
      break
    case 'giveResource':
      result = await supabase.rpc('admin_give_resource', { 
        p_country_id: params.countryId, 
        p_resource: params.resource, 
        p_amount: params.amount 
      })
      break
    default:
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json(result.data)
}