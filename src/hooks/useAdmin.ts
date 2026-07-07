import { Database } from '@/types/database'

export interface AdminLog {
  id: string
  admin_email: string
  action: string
  target: string | null
  target_id: string | null
  details: any
  status: 'success' | 'error' | 'warning'
  created_at: string
}

export function useAdmin() {
  
  // Função auxiliar para chamar a API
  async function callAdminApi(action: string, params?: any) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro na requisição')
    return data
  }

  // ─── FERRAMENTAS DE PODER ──────────────────────────────────
  async function resetWorld() {
    return callAdminApi('resetWorld')
  }

  async function toggleNpcCycle() {
    return callAdminApi('toggleNpcCycle')
  }

  async function forceNpcCycle() {
    return callAdminApi('forceNpcCycle')
  }

  async function toggleCountry(countryId: number) {
    return callAdminApi('toggleCountry', { countryId })
  }

  async function deleteRegion(regionId: string) {
    return callAdminApi('deleteRegion', { regionId })
  }

  async function endWar(warId: string) {
    return callAdminApi('endWar', { warId })
  }

  async function sendGlobalAnnouncement(title: string, message: string) {
    return callAdminApi('sendAnnouncement', { title, message })
  }

  async function giveResource(countryId: number, resource: string, amount: number) {
    return callAdminApi('giveResource', { countryId, resource, amount })
  }

  // ─── GERENCIAMENTO DE JOGADORES ───────────────────────────
  async function getPlayers() {
    const res = await fetch('/api/admin/players')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data
  }

  // ─── LOGS ──────────────────────────────────────────────────
  async function getLogs(limit: number = 50) {
    const res = await fetch(`/api/admin/logs?limit=${limit}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return data as AdminLog[]
  }

  return {
    resetWorld,
    toggleNpcCycle,
    forceNpcCycle,
    toggleCountry,
    deleteRegion,
    endWar,
    sendGlobalAnnouncement,
    giveResource,
    getPlayers,
    getLogs,
  }
}