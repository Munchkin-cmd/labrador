'use client'

import { useState } from 'react'
import { useWork } from '@/hooks/useMenu'
import { formatMoney, formatNumber } from '@/utils/format'

const TERRAINS = ['planicie','orogenico','extremista','anfibio']
const TERRAIN_LABELS: Record<string,string> = {
  planicie:'🌾 Planície', orogenico:'⛰️ Orogênico', extremista:'🏜️ Extremista', anfibio:'🌊 Ânfibio'
}

export default function WorkPage() {
  const { regions, buildings, catalog, economy, loading, build, createRegion } = useWork()

  const [tab, setTab]             = useState<'edificios'|'regioes'>('edificios')
  const [selectedRegion, setReg]  = useState('')
  const [selectedType, setType]   = useState('')
  const [qty, setQty]             = useState(1)
  const [feedback, setFeedback]   = useState('')
  const [submitting, setSub]      = useState(false)

  // New region form
  const [regName, setRegName]     = useState('')
  const [regTerrain, setRegT]     = useState('planicie')
  const [regArea, setRegArea]     = useState(100)
  const [regCoastal, setCoastal]  = useState(false)

  const selectedCat = catalog.find(c => c.type === selectedType)
  const grouped = catalog.reduce((acc: Record<string,any[]>, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {})

  async function handleBuild() {
    if (!selectedRegion || !selectedType) return
    setSub(true); setFeedback('')
    const res = await build(selectedRegion, selectedType, qty)
    setFeedback(res?.message ?? res?.error ?? 'Erro')
    setSub(false)
  }

  async function handleCreateRegion() {
    if (!regName.trim()) return
    setSub(true); setFeedback('')
    const res = await createRegion(regName, regTerrain, regArea, regCoastal)
    setFeedback(res?.success ? `Região criada! Custo: ${formatMoney(res.cost)}` : res?.error ?? 'Erro')
    if (res?.success) setRegName('')
    setSub(false)
  }

  if (loading) return <Loading />

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-4 pt-4">
        {(['edificios','regioes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors
              ${tab === t ? 'text-primary-light border-b-2 border-primary-light' : 'text-white/30'}`}>
            {t === 'edificios' ? '🏗️ Edifícios' : '🗺️ Regiões'}
          </button>
        ))}
      </div>

      {/* ── EDIFÍCIOS ── */}
      {tab === 'edificios' && (
        <div className="px-4 flex flex-col gap-4">

          {/* Recursos disponíveis */}
          <div className="bg-surface-card rounded-xl p-3">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">SEUS RECURSOS</p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                ['💵','Dinheiro', formatMoney(Number(economy?.money ?? 0))],
                ['⚡','Energia',  formatNumber(Number(economy?.energy ?? 0))],
                ['🪨','Ferro',    formatNumber(Number(economy?.iron ?? 0))],
                ['⚙️','Aço',     formatNumber(Number(economy?.steel ?? 0))],
                ['🪵','Madeira',  formatNumber(Number(economy?.wood ?? 0))],
                ['☢️','Urânio',   formatNumber(Number(economy?.uranium ?? 0))],
              ].map(([e, l, v]) => (
                <div key={String(l)} className="bg-surface rounded-lg p-1.5 text-center">
                  <span>{e}</span>
                  <p className="text-white font-bold">{v}</p>
                  <p className="text-white/30">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Selecionar região */}
          <div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">CONSTRUIR EDIFÍCIO</p>
            <select value={selectedRegion} onChange={e => setReg(e.target.value)} className="input-field mb-2">
              <option value="">Selecionar região...</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} · {TERRAIN_LABELS[r.terrain]} · Área livre: {r.area_km2 - r.used_area}km²
                </option>
              ))}
            </select>

            {/* Selecionar edifício */}
            <select value={selectedType} onChange={e => setType(e.target.value)} className="input-field mb-2">
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

            {/* Detalhes do edifício selecionado */}
            {selectedCat && (
              <div className="bg-surface rounded-xl p-3 mb-2 text-xs text-white/60">
                <div className="grid grid-cols-2 gap-1">
                  <span>Área: {selectedCat.area_km2}km²/un</span>
                  <span>Construção: 30min</span>
                  <span>Manutenção: {formatMoney(selectedCat.maint_money)}/30min</span>
                  <span>Lucro: {formatMoney(selectedCat.profit_money)}/30min</span>
                  {selectedCat.produces && <span>Produz: {selectedCat.produces_qty} {selectedCat.produces}/30min</span>}
                  {selectedCat.energy_produces > 0 && <span>Gera: {selectedCat.energy_produces} energia/30min</span>}
                  {selectedCat.energy_cost > 0 && <span>Consome: {selectedCat.energy_cost} energia/30min</span>}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))}
                className="input-field w-24" placeholder="Qtd" />
              <button onClick={handleBuild} disabled={!selectedRegion || !selectedType || submitting}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-30 text-white font-bold py-3 rounded-xl transition-colors">
                {submitting ? 'Construindo...' : '🏗️ CONSTRUIR'}
              </button>
            </div>

            {feedback && (
              <p className={`text-sm mt-2 ${feedback.includes('iniciada') ? 'text-green-400' : 'text-red-400'}`}>
                {feedback}
              </p>
            )}
          </div>

          {/* Edifícios construídos */}
          <div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">CONSTRUÍDOS</p>
            {buildings.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">Nenhum edifício ainda</p>
            ) : (
              buildings.map(b => (
                <div key={b.id} className="bg-surface-card rounded-xl p-3 mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold text-sm">{(b.building_catalog as any)?.name}</p>
                    <p className="text-white/40 text-xs">x{b.quantity}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_built ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400 animate-pulse'}`}>
                    {b.is_built ? '✅ Ativo' : '🔨 Construindo'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── REGIÕES ── */}
      {tab === 'regioes' && (
        <div className="px-4 flex flex-col gap-4">

          {/* Tabela de regiões */}
          <div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">SUAS REGIÕES</p>
            {regions.map(r => (
              <div key={r.id} className="bg-surface-card rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <p className="text-white/40 text-xs">{TERRAIN_LABELS[r.terrain]}</p>
                  </div>
                  <div className="text-right text-xs text-white/40">
                    <p>Área total: {r.area_km2}km²</p>
                    <p>Usada: {r.used_area}km²</p>
                    <p>Edifícios: {r.total_buildings}</p>
                  </div>
                </div>
                {/* Barra de uso */}
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(r.used_area / r.area_km2) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Criar nova região */}
          <div>
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">CRIAR NOVA REGIÃO</p>
            <p className="text-white/30 text-xs mb-3">Custo: R$500M por 10km²</p>
            <div className="bg-surface-card rounded-xl p-4 flex flex-col gap-3">
              <input value={regName} onChange={e => setRegName(e.target.value)}
                placeholder="Nome da região" className="input-field" />
              <select value={regTerrain} onChange={e => setRegT(e.target.value)} className="input-field">
                {TERRAINS.map(t => <option key={t} value={t}>{TERRAIN_LABELS[t]}</option>)}
              </select>
              <div className="flex items-center gap-3">
                <label className="text-white/50 text-sm flex-shrink-0">Área (km²):</label>
                <input type="number" min={10} step={10} value={regArea}
                  onChange={e => setRegArea(Number(e.target.value))} className="input-field flex-1" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={regCoastal} onChange={e => setCoastal(e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <span className="text-white/60 text-sm">Região costeira (permite navios e submarinos)</span>
              </label>
              {feedback && (
                <p className={`text-sm ${feedback.includes('criada') ? 'text-green-400' : 'text-red-400'}`}>{feedback}</p>
              )}
              <button onClick={handleCreateRegion} disabled={!regName.trim() || submitting}
                className="btn-primary disabled:opacity-30">
                {submitting ? 'Criando...' : '🗺️ CRIAR REGIÃO'}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
}
