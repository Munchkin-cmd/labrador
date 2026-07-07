'use client'

import { useEffect, useState } from 'react'
import { useAdmin, AdminLog } from '@/hooks/useAdmin'
import AdminTable from '@/components/admin/AdminTable'
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function AdminLogs() {
  const { getLogs } = useAdmin()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const data = await getLogs(100)
      setLogs(data || [])
      setLoading(false)
    }
    loadLogs()
  }, [])

  // Função auxiliar para renderizar o status com ícone e cor
  function renderStatus(status: string) {
    const map = {
      success: { icon: <CheckCircle size={14} className="text-green-400" />, label: 'Sucesso' },
      error: { icon: <XCircle size={14} className="text-red-400" />, label: 'Erro' },
      warning: { icon: <AlertCircle size={14} className="text-yellow-400" />, label: 'Aviso' },
    }
    const s = map[status as keyof typeof map] || map.warning
    return (
      <div className="flex items-center gap-1.5">
        {s.icon}
        <span className="text-xs">{s.label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} /> Logs do Sistema
          </h1>
          <p className="text-white/40 text-sm mt-1">Histórico de ações do administrador</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs bg-white/10 hover:bg-white/20 text-white/70 px-3 py-1.5 rounded-lg transition-colors"
        >
          Atualizar
        </button>
      </div>

      <AdminTable
        data={logs}
        loading={loading}
        columns={[
          { 
            key: 'created_at', 
            header: 'Data/Hora', 
            render: (v) => new Date(v).toLocaleString('pt-BR') 
          },
          { key: 'admin_email', header: 'Admin' },
          { key: 'action', header: 'Ação' },
          { 
            key: 'target', 
            header: 'Alvo', 
            render: (v, row) => v ? `${v} (${row.target_id})` : '-' 
          },
          { 
            key: 'status', 
            header: 'Status', 
            render: (v) => renderStatus(v) 
          },
        ]}
      />
    </div>
  )
}