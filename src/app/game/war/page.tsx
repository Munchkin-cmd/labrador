'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWar } from '@/hooks/useWar'
import { formatNumber } from '@/utils/format'
import { Swords } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const UNITS = [
  { key: 'soldiers',   label: 'Soldados',    emoji: '⚔️' },
  { key: 'tanks',      label: 'Tanques',      emoji: '🛡️' },
  { key: 'artillery',  label: 'Artilharia',   emoji: '💣' },
  { key: 'aircraft',   label: 'Aeronaves',    emoji: '✈️' },
  { key: 'helicopters',label: 'Helicópteros', emoji: '🚁' },
  { key: 'drones',     label: 'Drones',       emoji: '🤖' },
  { key: 'missiles',   label: 'Mísseis',      emoji: '🎯' },
]

export default function WarPage() {
  const { myWars, worldWars, military, loading, attack, proposePeace } = useWar()
  const { country: myCountry } = useAuthStore()
  const [attackWarId, setAttackWarId]     = useState('')
  const [attackUnit, setAttackUnit]       = useState('')
  const [attackQty, setAttackQty]         = useState(1)
  const [feedback, setFeedback]           = useState('')
  const [submitting, setSubmitting]       = useState(false)

  if (loading) return <PageLoading />

  async function handleAttack() {
    if (!attackWarId || !attackUnit) return
    setSubmitting(true)
    const res = await attack(attackWarId, attackUnit, attackQty)
    setFeedback(res?.success
      ? `Ataque realizado! Dano: ${res.damage_dealt} | Baixas: ${res.losses_suffered}`
      : res?.error ?? 'Erro')
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col pb-24 min-h-screen bg-[#1a1a1a] pt-4">
      
      {/* ─── GUERRAS DO JOGADOR ──────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-4">
        {myWars.length === 0 ? (
          <div className="bg-[#2a2a2a] rounded-xl p-4 flex items-center gap-3 border border-white/5">
            <span className="text-2xl">🕊️</span>
            <p className="text-white/50 text-sm font-medium">Sem guerras ativas no seu estado!</p>
          </div>
        ) : (
          myWars.map(war => (
            <div key={war.id} className="bg-[#2a2a2a] rounded-xl p-4 border border-white/5">
              
              {/* Topo: Atacante vs Defensor */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center mb-1">
                    {(war.attacker as any)?.flag_url ? (
                      <img 
                        src={(war.attacker as any).flag_url} 
                        alt={(war.attacker as any)?.name || 'Atacante'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{(war.attacker as any)?.flag_emoji || '⚔️'}</span>
                    )}
                  </div>
                  <p className="text-white font-bold text-sm text-center leading-tight">
                    <Link 
                      href={`/game/pais/${(war.attacker as any)?.slug || ''}`}
                      className="hover:text-primary-light transition-colors"
                    >
                      {(war.attacker as any)?.name || 'Atacante'}
                    </Link>
                  </p>
                  <p className="text-white/30 text-[10px]">Danos: 0</p>
                </div>

                {/* Centro: Dano + Barra + Botão */}
                <div className="flex flex-col items-center flex-1 px-2">
                  <p className="text-white/40 text-[10px] uppercase mb-1">Danos:</p>
                  <p className="text-white font-bold text-lg tracking-tight">
                    830.200.000
                  </p>
                  
                  {/* Barra de dano */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 mb-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }} />
                  </div>

                  <button
                    onClick={() => setAttackWarId(war.id)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Swords size={16} />
                    Lutar
                  </button>
                  
                  <p className="text-white/30 text-[10px] mt-1">
                    A guerra termina em: <span className="text-white/60">00:20:25</span>
                  </p>
                </div>

                {/* Direita: Defensor */}
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-16 h-16 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center mb-1">
                    {(war.defender as any)?.flag_url ? (
                      <img 
                        src={(war.defender as any).flag_url} 
                        alt={(war.defender as any)?.name || 'Defensor'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{(war.defender as any)?.flag_emoji || '🛡️'}</span>
                    )}
                  </div>
                  <p className="text-white font-bold text-sm text-center leading-tight">
                    <Link 
                      href={`/game/pais/${(war.defender as any)?.slug || ''}`}
                      className="hover:text-primary-light transition-colors"
                    >
                      {(war.defender as any)?.name || 'Defensor'}
                    </Link>
                  </p>
                  <p className="text-white/30 text-[10px]">Danos: {formatNumber(830200000)}</p>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ─── BOTÃO DE REDIRECIONAMENTO PARA TREINAMENTO ──────── */}
      <div className="px-4 mb-4">
        <Link
          href="/game/treinamento"
          className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors text-center"
        >
          TREINAMENTO MILITAR
        </Link>
      </div>

      {/* ─── GUERRAS DO MUNDO ─────────────────────────────────── */}
      <div className="px-4 pb-24">
        <p className="text-white/30 text-sm mb-3">
          Todas as guerras do mundo ({worldWars.length})
        </p>

        <div className="flex flex-col gap-3">
          {worldWars.slice(0, 5).map(war => (
            <div key={war.id} className="bg-[#2a2a2a] rounded-xl p-3 border border-white/5 flex items-center">
              
              <div className="flex flex-col items-center w-16 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center mb-1">
                  {(war.attacker as any)?.flag_url ? (
                    <img 
                      src={(war.attacker as any).flag_url} 
                      alt={(war.attacker as any)?.name || 'Atacante'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">{(war.attacker as any)?.flag_emoji || '⚔️'}</span>
                  )}
                </div>
                <p className="text-white/60 text-[10px] text-center leading-tight">
                  <Link 
                    href={`/game/pais/${(war.attacker as any)?.slug || ''}`}
                    className="hover:text-primary-light transition-colors"
                  >
                    {(war.attacker as any)?.name || 'Atacante'}
                  </Link>
                </p>
                <p className="text-white/30 text-[8px]">Danos: 0</p>
              </div>

              <div className="flex-1 px-3 flex flex-col items-center">
                <p className="text-white/40 text-[8px] uppercase">Danos:</p>
                <p className="text-white font-bold text-sm">1.006.608.817</p>
                <div className="w-full h-1 bg-white/10 rounded-full mt-1">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                </div>
                <button
                  onClick={() => setAttackWarId(war.id)}
                  className="mt-1 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold py-1 px-4 rounded transition-colors"
                >
                  <Swords size={12} className="inline mr-1" />
                  Lutar
                </button>
                <p className="text-white/30 text-[8px] mt-0.5">
                  A guerra termina em: <span className="text-white/60">00:14:13</span>
                </p>
              </div>

              <div className="flex flex-col items-center w-16 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center mb-1">
                  {(war.defender as any)?.flag_url ? (
                    <img 
                      src={(war.defender as any).flag_url} 
                      alt={(war.defender as any)?.name || 'Defensor'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">{(war.defender as any)?.flag_emoji || '🛡️'}</span>
                  )}
                </div>
                <p className="text-white/60 text-[10px] text-center leading-tight">
                  <Link 
                    href={`/game/pais/${(war.defender as any)?.slug || ''}`}
                    className="hover:text-primary-light transition-colors"
                  >
                    {(war.defender as any)?.name || 'Defensor'}
                  </Link>
                </p>
                <p className="text-white/30 text-[8px]">Danos: {formatNumber(1006608817)}</p>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL DE ATAQUE (Slide-up) ───────────────────────── */}
      {attackWarId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-[#1a1a1a] rounded-t-2xl p-6 border-t border-white/5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">⚔️ Enviar Ataque</h3>
              <button onClick={() => setAttackWarId('')} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>

            <select value={attackUnit} onChange={e => setAttackUnit(e.target.value)} className="input-field mb-3">
              <option value="">Selecionar unidade...</option>
              {UNITS.map(u => (
                <option key={u.key} value={u.key}>
                  {u.emoji} {u.label} (disp.: {military?.[u.key] ?? 0})
                </option>
              ))}
            </select>

            <div className="flex gap-2 mb-3">
              <input
                type="number"
                min={1}
                value={attackQty}
                onChange={e => setAttackQty(Number(e.target.value))}
                className="input-field flex-1"
                placeholder="Quantidade"
              />
              <button
                onClick={handleAttack}
                disabled={!attackUnit || submitting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-bold px-6 rounded-xl transition-colors"
              >
                ATACAR
              </button>
            </div>

            {feedback && <p className="text-sm text-yellow-400">{feedback}</p>}
          </div>
        </div>
      )}
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