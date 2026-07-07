'use client'

import { useState } from 'react'
import { useAdmin } from '@/hooks/useAdmin'
import { Power, RefreshCw, Globe, AlertTriangle } from 'lucide-react'

export default function WorldControl() {
  const { 
    resetWorld, 
    toggleNpcCycle, 
    forceNpcCycle, 
    sendGlobalAnnouncement 
  } = useAdmin()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [announcement, setAnnouncement] = useState({ title: '', message: '' })

  async function handleAction(fn: () => Promise<any>, successMsg: string) {
    setLoading(true)
    const res = await fn()
    setMessage(res.message || successMsg)
    setLoading(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleAnnouncement() {
    if (!announcement.title || !announcement.message) {
      setMessage('Preencha título e mensagem')
      return
    }
    await handleAction(
      () => sendGlobalAnnouncement(announcement.title, announcement.message),
      'Anúncio enviado!'
    )
    setAnnouncement({ title: '', message: '' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Globe /> Controle do Mundo
      </h1>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.includes('erro') 
            ? 'bg-red-500/10 border border-red-500/30 text-red-400' 
            : 'bg-green-500/10 border border-green-500/30 text-green-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Power size={16} /> NPCs
          </h3>
          <div className="flex gap-3 mt-3">
            <button 
              onClick={() => handleAction(toggleNpcCycle, 'Ciclo alterado')}
              disabled={loading}
              className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              Pausar / Retomar
            </button>
            <button 
              onClick={() => handleAction(forceNpcCycle, 'Ciclo forçado')}
              disabled={loading}
              className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 rounded-lg font-semibold text-sm transition-colors"
            >
              Forçar Ciclo
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
          <h3 className="text-white font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> Resetar Mundo
          </h3>
          <p className="text-white/30 text-xs mt-1">Isso apagará todos os dados de jogadores e NPCs.</p>
          <button 
            onClick={() => {
              if (confirm('Tem certeza? Isso apagará TUDO!')) {
                handleAction(resetWorld, 'Mundo resetado!')
              }
            }}
            disabled={loading}
            className="mt-3 w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            Resetar Mundo
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
        <h3 className="text-white font-bold flex items-center gap-2">
          📢 Anúncio Global
        </h3>
        <div className="space-y-3 mt-3">
          <input
            value={announcement.title}
            onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
            placeholder="Título do anúncio"
            className="input-field"
          />
          <textarea
            value={announcement.message}
            onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
            placeholder="Mensagem do anúncio"
            className="input-field h-24 resize-none"
          />
          <button 
            onClick={handleAnnouncement}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            Enviar Anúncio
          </button>
        </div>
      </div>
    </div>
  )
}