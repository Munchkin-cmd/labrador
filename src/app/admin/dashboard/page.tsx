'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminCard from '@/components/admin/AdminCard'
import { Users, Globe, Shield, AlertCircle, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const { getPlayers, getLogs } = useAdmin()
  const [stats, setStats] = useState({ players: 0, npcs: 0, wars: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const players = await getPlayers()
      // Aqui você pode adicionar outras consultas para wars, etc.
      setStats({
        players: players?.length || 0,
        npcs: 82 - (players?.length || 0),
        wars: 0, // Você pode buscar de wars depois
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Activity /> Dashboard
      </h1>
      <p className="text-white/40">Visão geral do jogo</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard 
          title="Jogadores Ativos" 
          value={loading ? '...' : stats.players} 
          icon={<Users size={20} />}
          color="green"
        />
        <AdminCard 
          title="NPCs" 
          value={loading ? '...' : stats.npcs} 
          icon={<Globe size={20} />}
          color="yellow"
        />
        <AdminCard 
          title="Guerras Ativas" 
          value={loading ? '...' : stats.wars} 
          icon={<Shield size={20} />}
          color="red"
        />
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
        <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-2">Últimas Ações</p>
        <p className="text-white/30 text-sm">Logs aparecerão aqui em breve.</p>
      </div>
    </div>
  )
}