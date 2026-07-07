'use client'

import { useState, useEffect } from 'react'
import { useTaxes } from '@/hooks/useMenu'

const TAX_FIELDS = [
  { key: 'income_tax',        label: 'Imposto de Renda',         desc: 'Incide sobre salários e rendimentos pessoais' },
  { key: 'corporate_tax',     label: 'Imposto Corporativo',       desc: 'Incide sobre lucro das empresas' },
  { key: 'property_tax',      label: 'Imposto de Propriedade',    desc: 'Incide sobre imóveis e terras' },
  { key: 'manufacturing_tax', label: 'Manufatura Avançada',       desc: 'Incide sobre produção industrial' },
  { key: 'vat',               label: 'IVA',                       desc: 'Imposto sobre valor agregado (consumo)' },
  { key: 'customs',           label: 'Alfandegário',              desc: 'Incide sobre importações e exportações' },
]

export default function TaxPage() {
  const { taxes, loading, saving, saveTaxes } = useTaxes()
  const [values, setValues] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (taxes) {
      const v: Record<string, number> = {}
      TAX_FIELDS.forEach(f => { v[f.key] = Number(taxes[f.key] ?? 0) })
      setValues(v)
    }
  }, [taxes])

  async function handleSave() {
    setFeedback('')
    const res = await saveTaxes(values)
    setFeedback(res.success ? '✅ Alterações salvas!' : '❌ Erro ao salvar')
    setTimeout(() => setFeedback(''), 3000)
  }

  if (loading) return <Loading />

  const totalTax = Object.values(values).reduce((s, v) => s + v, 0)
  const avgTax = totalTax / TAX_FIELDS.length

  // Verifica se alguma taxa ultrapassou o limite de 60%
  const hasOverLimit = Object.values(values).some(v => v > 60)

  return (
    <div className="flex flex-col gap-5 pb-6 p-4">

      <div>
        <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-1">TABELA DE IMPOSTOS</p>
        <p className="text-white/30 text-xs">Cada imposto pode ser ajustado até 60%.</p>
      </div>

      {/* Total indicator */}
      <div className="bg-surface-card rounded-xl p-3 flex flex-col gap-1 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Carga tributária total (média)</span>
          <span className={`text-lg font-black ${avgTax > 40 ? 'text-red-400' : avgTax > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
            {avgTax.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-white/30 text-xs">Receita estimada por turno</span>
          <span className="text-green-400 text-sm font-bold">
            +{(avgTax * 10000 * TAX_FIELDS.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        {hasOverLimit && (
          <div className="mt-2 text-red-400 text-xs font-semibold border border-red-500/30 bg-red-500/10 rounded-lg p-2 text-center">
            ⚠️ Atenção: Algum imposto ultrapassou 60%. O slider foi limitado ao máximo permitido.
          </div>
        )}
      </div>

      {/* Tax sliders */}
      <div className="bg-surface-card rounded-xl p-4 flex flex-col gap-5 border border-white/5">
        {TAX_FIELDS.map(field => (
          <div key={field.key}>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-white text-sm font-semibold">{field.label}</label>
              <span className="text-primary-light font-black text-base">{values[field.key]?.toFixed(1)}%</span>
            </div>
            {/* ✅ Slider com limite máximo de 60% por taxa */}
            <input
              type="range"
              min={0} max={60} step={0.5}
              value={values[field.key] ?? 0}
              onChange={e => setValues(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
              className="w-full accent-primary h-1.5 rounded-full"
            />
            <p className="text-white/30 text-xs mt-1">{field.desc}</p>
          </div>
        ))}
      </div>

      {feedback && (
        <p className={`text-sm text-center ${feedback.includes('salvas') ? 'text-green-400' : 'text-red-400'}`}>
          {feedback}
        </p>
      )}

      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
      </button>

    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
}