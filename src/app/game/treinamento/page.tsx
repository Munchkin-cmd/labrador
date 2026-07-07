'use client'

import { useState } from 'react'
import { useWar } from '@/hooks/useWar'
import { formatNumber } from '@/utils/format'

const UNITS = [
  { key: 'soldiers',   label: 'Soldados',    emoji: '⚔️' },
  { key: 'tanks',      label: 'Tanques',      emoji: '🛡️' },
  { key: 'artillery',  label: 'Artilharia',   emoji: '💣' },
  { key: 'aircraft',   label: 'Aeronaves',    emoji: '✈️' },
  { key: 'helicopters',label: 'Helicópteros', emoji: '🚁' },
  { key: 'drones',     label: 'Drones',       emoji: '🤖' },
  { key: 'missiles',   label: 'Mísseis',      emoji: '🎯' },
]

export default function TreinamentoPage() {
  const { trainings, military, loading, startTraining } = useWar()
  const [trainingUnit, setTrainingUnit]   = useState('')
  const [trainingQty, setTrainingQty]     = useState(1)
  const [feedback, setFeedback]           = useState('')
  const [submitting, setSubmitting]       = useState(false)

  if (loading) return <PageLoading />

  async function handleTrain() {
    if (!trainingUnit) return
    setSubmitting(true)
    const res = await startTraining(trainingUnit, trainingQty)
    setFeedback(res?.message ?? res?.error ?? 'Erro')
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-5 pb-6 pt-4 px-4">
      <p className="text-xs font-bold tracking-widest text-white/40 uppercase">TREINAMENTO MILITAR</p>

      {/* ─── INICIAR TREINAMENTO ───────────────────────────────── */}
      <Section title="🎖️ INICIAR TREINAMENTO">
        <p className="text-white/40 text-xs mb-3">Duração: 24h · Efeito: +0.5 ⭐ por treino · Máximo: 5 ⭐</p>

        <select value={trainingUnit} onChange={e => setTrainingUnit(e.target.value)} className="input-field mb-3">
          <option value="">Selecionar unidade para treinar...</option>
          {UNITS.map(u => (
            <option key={u.key} value={u.key}>{u.emoji} {u.label}</option>
          ))}
        </select>

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min={1}
            value={trainingQty}
            onChange={e => setTrainingQty(Number(e.target.value))}
            className="input-field flex-1"
            placeholder="Quantidade"
          />
          <button
            onClick={handleTrain}
            disabled={!trainingUnit || submitting}
            className="bg-primary hover:bg-primary-light disabled:opacity-30 text-white font-bold px-5 rounded-xl transition-colors"
          >
            TREINAR
          </button>
        </div>

        {feedback && <p className="text-sm text-green-400 mb-2">{feedback}</p>}
      </Section>

      {/* ─── TREINAMENTOS EM ANDAMENTO ─────────────────────────── */}
      <Section title="⏳ TREINAMENTOS EM ANDAMENTO">
        {trainings.filter(t => t.status === 'in_progress').length === 0 ? (
          <p className="text-white/30 text-sm text-center py-3">Nenhum treinamento em andamento</p>
        ) : (
          trainings.filter(t => t.status === 'in_progress').map(t => (
            <div key={t.id} className="bg-surface rounded-xl p-3 mb-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-white/70 text-sm font-semibold">{t.equipment_type} × {t.quantity}</p>
                <p className="text-white/40 text-xs">
                  {new Date(t.end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${t.progress}%` }} />
              </div>
              <p className="text-white/30 text-xs mt-1">
                ⭐ {t.quality_before} → ⭐ {t.quality_after}
              </p>
            </div>
          ))
        )}
      </Section>

      {/* ─── SUAS UNIDADES MILITARES ──────────────────────────── */}
      <Section title="⚔️ SUAS UNIDADES">
        {military ? (
          <div className="grid grid-cols-3 gap-2">
            {UNITS.map(u => (
              <div key={u.key} className="bg-surface rounded-xl p-2.5 flex flex-col items-center gap-1">
                <span className="text-xl">{u.emoji}</span>
                <span className="text-white font-bold text-sm">{formatNumber(military[u.key] ?? 0)}</span>
                <span className="text-white/40 text-xs">{u.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-sm text-center py-3">Carregando unidades...</p>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold tracking-widest text-white/40 uppercase">{title}</p>
      <div className="bg-surface-card rounded-xl p-3">{children}</div>
    </div>
  )
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}