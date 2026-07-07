'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import AdminTable from '@/components/admin/AdminTable'

export default function AdminPlayers() {
  const { getPlayers, toggleCountry } = useAdmin()
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPlayers()
  }, [])

  async function loadPlayers() {
    setLoading(true)
    const data = await getPlayers()
    setPlayers(data || [])
    setLoading(false)
  }

  async function handleToggle(id: number) {
    const res = await toggleCountry(id)
    setMessage(res.message)
    loadPlayers()
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        👤 Jogadores
      </h1>

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
          {message}
        </div>
      )}

      <AdminTable
        data={players}
        loading={loading}
        columns={[
          { key: 'email', header: 'Email' },
          { key: 'country_name', header: 'País' },
          { key: 'role', header: 'Role' },
          { key: 'is_active', header: 'Status', render: (v) => v ? '🟢 Ativo' : '🔴 NPC' },
          { 
            key: 'country_id', 
            header: 'Ações', 
            render: (id) => (
              <button 
                onClick={() => handleToggle(Number(id))}
                className="text-xs bg-primary/20 hover:bg-primary/30 text-primary-light px-3 py-1 rounded-lg transition-colors"
              >
                Toggle
              </button>
            )
          },
        ]}
      />
    </div>
  )
}