'use client'

import { useState, useEffect, useRef } from 'react'
import { useRede } from '@/hooks/useRede'
import { useWar } from '@/hooks/useWar'
import { formatMoney, formatNumber, formatTime } from '@/utils/format'
import { Hammer, Factory, Package, RefreshCw } from 'lucide-react'

const UNITS = [
  { key: 'soldiers',   label: 'Soldados',    emoji: '⚔️', cost: 5000000, resources: 'Nenhum' },
  { key: 'tanks',      label: 'Tanques',      emoji: '🛡️', cost: 20000000, resources: '5 Aço, 2 Ferro' },
  { key: 'artillery',  label: 'Artilharia',   emoji: '💣', cost: 15000000, resources: '3 Aço, 2 Ferro' },
  { key: 'aircraft',   label: 'Aeronaves',    emoji: '✈️', cost: 80000000, resources: '5 Aço, 2 Urânio' },
  { key: 'helicopters',label: 'Helicópteros', emoji: '🚁', cost: 40000000, resources: '3 Aço' },
  { key: 'drones',     label: 'Drones',       emoji: '🤖', cost: 10000000, resources: '1 Aço' },
  { key: 'missiles',   label: 'Mísseis',      emoji: '🎯', cost: 50000000, resources: '5 Aço, 2 Urânio' },
]

export default function RedePage() {
  const { regions, buildings, catalog, economy, loading, build, produceEquipment, refetch: refetchRede } = useRede()
  const { military, refetch: refetchMilitary } = useWar()
  
  // ─── ESTADOS DE CONSTRUÇÃO ───────────────────────────────
  const [selectedRegion, setReg]  = useState('')
  const [selectedType, setType]   = useState('')
  const [qty, setQty]             = useState(1)
  const [feedback, setFeedback]   = useState('')
  const [submitting, setSub]      = useState(false)

  // ─── ESTADOS DE PRODUÇÃO ──────────────────────────────────
  const [prodUnit, setProdUnit]   = useState('')
  const [prodQty, setProdQty]     = useState(1)
  const [prodFeedback, setProdFeedback] = useState('')
  const [prodSubmitting, setProdSub] = useState(false)

  // ─── TIMER DE PRODUÇÃO (CICLO DE 30 MINUTOS) ─────────────
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const nextCycle = new Date()
    nextCycle.setMinutes(Math.ceil(nextCycle.getMinutes() / 30) * 30, 0, 0)
    
    const updateTimer = () => {
      const now = Date.now()
      const msLeft = nextCycle.getTime() - now
      setTimeLeft(msLeft > 0 ? msLeft : 0)
    }

    updateTimer() // Roda na primeira vez

    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  // ✅ CORREÇÃO: Prevenir loop infinito monitorando construções
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (buildings.length === 0) return

    // Filtra apenas os que ainda não estão prontos
    const inConstruction = buildings.filter(b => !b.is_built)
    if (inConstruction.length === 0) return // Se não tem nenhum em construção, não faz nada

    const nextFinish = Math.min(
      ...inConstruction.map(b => new Date(b.finished_at).getTime())
    )

    // Se já passou do tempo, apenas atualiza sem criar loop
    if (!nextFinish || nextFinish <= Date.now()) {
      // Evita chamar refetch se o timer ainda não foi limpo
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      // Dá um pequeno delay para não causar loop infinito
      timerRef.current = setTimeout(() => {
        refetchRede()
        timerRef.current = null
      }, 500)
      return
    }

    // Se estiver no futuro, agenda um refetch para quando o próximo terminar
    const delay = nextFinish - Date.now() + 1000
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      refetchRede()
      timerRef.current = null
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [buildings, refetchRede]) // Ainda depende de refetch, mas o timerRef previne loops

  const selectedCat = catalog.find(c => c.type === selectedType)
  const grouped = catalog.reduce((acc: Record<string,any[]>, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  // ─── FUNÇÕES DE CONSTRUÇÃO ──────────────────────────────
  async function handleBuild() {
    if (!selectedRegion || !selectedType) return
    setSub(true); setFeedback('')
    const res = await build(selectedRegion, selectedType, qty)
    setFeedback(res?.message ?? res?.error ?? 'Erro')
    setSub(false)
  }

  // ─── FUNÇÕES DE PRODUÇÃO DE EQUIPAMENTOS ────────────────
  async function handleProduce() {
    if (!prodUnit) return
    setProdSub(true); setProdFeedback('')
    const res = await produceEquipment(prodUnit, prodQty)
    setProdFeedback(res?.message ?? res?.error ?? 'Erro')
    await refetchMilitary()
    setProdSub(false)
  }

  if (loading) return <Loading />

  return (
    <div className="flex flex-col gap-4 pb-24 px-4 pt-4">

      {/* ─── CABEÇALHO COM TIMER DE PRODUÇÃO ─────────────────── */}
      <div className="bg-surface-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory size={20} className="text-primary-light" />
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase">Próxima Produção</p>
            <p className="text-white font-bold text-sm font-mono">
              {timeLeft > 0 ? formatTime(new Date(Date.now() + timeLeft).toISOString()) : 'Processando...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/30 text-xs">
          <RefreshCw size={12} className="animate-spin-slow" />
          <span>Ciclo de 30 min</span>
        </div>
      </div>

      {/* ─── DASHBOARD DE PRODUÇÃO ATIVA ────────────────────── */}
      <div>
        <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">📊 PRODUÇÃO ATIVA</p>
        <div className="bg-surface-card rounded-xl p-4 border border-white/5">
          {buildings.filter(b => b.is_built).length === 0 ? (
            <p className="text-white/30 text-sm text-center py-2">Nenhum edifício ativo produzindo.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {buildings.filter(b => b.is_built).slice(0, 6).map(b => (
                <div key={b.id} className="bg-surface rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{(b.building_catalog as any)?.emoji || '🏭'}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{(b.building_catalog as any)?.name}</p>
                      <p className="text-white/30 text-xs">x{b.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-xs font-bold">
                      +{formatMoney((b.building_catalog as any)?.profit_money || 0)}
                    </p>
                    <p className="text-white/30 text-[10px]">a cada 30min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 text-center">
            <button className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Ver todos os edifícios →
            </button>
          </div>
        </div>
      </div>

      {/* ─── CONSTRUÇÃO DE EDIFÍCIOS ─────────────────────────── */}
      <div className="bg-surface-card rounded-xl p-4 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Hammer size={18} className="text-white/40" />
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase">Construir Edifício</p>
        </div>

        <div className="flex flex-col gap-2">
          <select value={selectedRegion} onChange={e => setReg(e.target.value)} className="input-field text-sm">
            <option value="">Selecionar região...</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.area_km2 - r.used_area}km² livres
              </option>
            ))}
          </select>

          <select value={selectedType} onChange={e => setType(e.target.value)} className="input-field text-sm">
            <option value="">Selecionar edifício...</option>
            {Object.entries(grouped).map(([cat, items]) => (
              <optgroup key={cat} label={cat.toUpperCase()}>
                {items.map(b => (
                  <option key={b.type} value={b.type}>
                    {b.name} · {formatMoney(b.cost_money)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {selectedCat && (
            <div className="bg-white/5 rounded-lg p-3 text-xs text-white/60 grid grid-cols-2 gap-1">
              <span>Área: {selectedCat.area_km2}km²/un</span>
              <span>Construção: 30min</span>
              <span>Manutenção: {formatMoney(selectedCat.maint_money)}/ciclo</span>
              <span>Lucro: {formatMoney(selectedCat.profit_money)}/ciclo</span>
              {selectedCat.produces && <span>Produz: {selectedCat.produces_qty} {selectedCat.produces}/ciclo</span>}
              {selectedCat.energy_produces > 0 && <span>Gera: {selectedCat.energy_produces} energia</span>}
              {selectedCat.energy_cost > 0 && <span>Consome: {selectedCat.energy_cost} energia</span>}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))}
              className="input-field w-20 text-sm" placeholder="Qtd" />
            <button onClick={handleBuild} disabled={!selectedRegion || !selectedType || submitting}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-30 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              {submitting ? 'Construindo...' : 'CONSTRUIR'}
            </button>
          </div>

          {feedback && (
            <p className={`text-sm mt-1 ${feedback.includes('iniciada') ? 'text-green-400' : 'text-red-400'}`}>
              {feedback}
            </p>
          )}
        </div>

        {/* ─── EDIFÍCIOS EM CONSTRUÇÃO (COM BARRA DE PROGRESSO) ── */}
        {buildings.filter(b => !b.is_built).length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-white/40 mb-1">🔨 Em construção</p>
            {buildings.filter(b => !b.is_built).map(b => {
              const total = 30 * 60 * 1000 // 30 minutos em ms
              const elapsed = Date.now() - new Date(b.started_at).getTime()
              const progress = Math.min(100, (elapsed / total) * 100)
              const remaining = Math.max(0, total - elapsed)
              return (
                <div key={b.id} className="bg-white/5 rounded-lg p-2.5 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/70 text-sm">{(b.building_catalog as any)?.name}</span>
                    <span className="text-white/30 text-xs">
                      {formatTime(new Date(Date.now() + remaining).toISOString())}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── PRODUÇÃO DE EQUIPAMENTOS MILITARES ──────────────── */}
      <div className="bg-surface-card rounded-xl p-4 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Package size={18} className="text-white/40" />
          <p className="text-xs font-bold tracking-widest text-white/40 uppercase">Produzir Equipamento</p>
        </div>

        <div className="flex flex-col gap-2">
          <select value={prodUnit} onChange={e => setProdUnit(e.target.value)} className="input-field text-sm">
            <option value="">Selecionar equipamento...</option>
            {UNITS.map(u => (
              <option key={u.key} value={u.key}>
                {u.emoji} {u.label} ({formatMoney(u.cost)})
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input type="number" min={1} value={prodQty} onChange={e => setProdQty(Number(e.target.value))}
              className="input-field w-20 text-sm" placeholder="Qtd" />
            <button onClick={handleProduce} disabled={!prodUnit || prodSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
              {prodSubmitting ? 'Produzindo...' : 'PRODUZIR'}
            </button>
          </div>

          {prodFeedback && (
            <p className={`text-sm mt-1 ${prodFeedback.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
              {prodFeedback}
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
}