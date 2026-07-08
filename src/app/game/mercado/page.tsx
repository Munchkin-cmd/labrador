'use client'

import { useState } from 'react'
import { useMarket } from '@/hooks/useMenu'
import { formatMoney, formatNumber } from '@/utils/format'

const RESOURCES = ['gold','iron','oil','food','wood','uranium','coal','steel']
const RESOURCE_EMOJI: Record<string, string> = {
  gold:'🪙', iron:'🪨', oil:'🛢️', food:'🌾', wood:'🪵', uranium:'☢️', coal:'⛏️', steel:'⚙️'
}

export default function MercadoPage() {
  const { offers, myOffers, loading, placeOrder, buyOffer } = useMarket()
  const [tab, setTab]           = useState<'comprar'|'vender'|'minhas'>('comprar')
  const [filterRes, setFilter]  = useState('')
  const [newRes, setNewRes]     = useState('gold')
  const [newType, setNewType]   = useState<'sell'|'buy'>('sell')
  const [newQty, setNewQty]     = useState(100)
  const [newPrice, setNewPrice] = useState(1000)
  const [buyQtys, setBuyQtys]   = useState<Record<string,number>>({})
  const [feedback, setFeedback] = useState('')
  const [submitting, setSub]    = useState(false)

  const filtered = offers.filter(o =>
    (tab === 'comprar' ? o.order_type === 'sell' : o.order_type === 'buy') &&
    (!filterRes || o.resource_type === filterRes)
  )

  async function handlePlace() {
    setSub(true); setFeedback('')
    const res = await placeOrder(newRes, newType, newQty, newPrice)
    setFeedback(
      typeof res === 'object' && res !== null
        ? (res as any)?.message ?? (res as any)?.error ?? 'Erro'
        : 'Erro'
    )
    setSub(false)
  }

  async function handleBuy(orderId: string) {
    const qty = buyQtys[orderId] ?? 1
    setSub(true); setFeedback('')
    const res = await buyOffer(orderId, qty)
    setFeedback((res as any)?.success ? 'Compra realizada!' : (res as any)?.error ?? 'Erro')
    setSub(false)
  }

  if (loading) return <Loading />

  return (
    <div className="flex flex-col gap-4 pb-6">

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-4 pt-4">
        {(['comprar','vender','minhas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors
              ${tab === t ? 'text-primary-light border-b-2 border-primary-light' : 'text-white/30'}`}>
            {t === 'comprar' ? '🛒 Comprar' : t === 'vender' ? '📤 Vender' : '📋 Minhas'}
          </button>
        ))}
      </div>

      {(tab === 'comprar' || tab === 'vender') && (
        <div className="px-4 flex flex-col gap-4">
          {/* Filtro */}
          <select value={filterRes} onChange={e => setFilter(e.target.value)} className="input-field">
            <option value="">Todos os recursos</option>
            {RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_EMOJI[r]} {r}</option>)}
          </select>

          {feedback && (
            <p className={`text-sm px-3 py-2 rounded-lg ${feedback.includes('realizada') || feedback.includes('Oferta') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {feedback}
            </p>
          )}

          {/* Lista de ofertas */}
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm">Nenhuma oferta disponível</p>
            </div>
          ) : (
            filtered.map(offer => (
              <div key={offer.id} className="bg-surface-card rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{(offer.countries as any)?.flag_emoji ?? '🌐'}</span>
                  <div className="flex-1">
                    <p className="text-white/70 text-xs font-semibold">{(offer.countries as any)?.name}</p>
                    <p className="text-white/40 text-xs">{RESOURCE_EMOJI[offer.resource_type]} {offer.resource_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{formatMoney(offer.price_per_unit)}/un</p>
                    <p className="text-white/40 text-xs">Disp: {formatNumber(offer.available_qty)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number" min={1} max={offer.available_qty}
                    value={buyQtys[offer.id] ?? 1}
                    onChange={e => setBuyQtys(prev => ({ ...prev, [offer.id]: Number(e.target.value) }))}
                    className="input-field flex-1 py-2 text-sm"
                    placeholder="Qtd"
                  />
                  <button
                    onClick={() => handleBuy(offer.id)}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary-light disabled:opacity-30 text-white font-bold px-4 rounded-xl text-sm transition-colors"
                  >
                    {tab === 'comprar' ? 'COMPRAR' : 'ACEITAR'}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Criar oferta */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">CRIAR OFERTA</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <select value={newRes} onChange={e => setNewRes(e.target.value)} className="input-field flex-1">
                  {RESOURCES.map(r => <option key={r} value={r}>{RESOURCE_EMOJI[r]} {r}</option>)}
                </select>
                <select value={newType} onChange={e => setNewType(e.target.value as any)} className="input-field flex-1">
                  <option value="sell">Vender</option>
                  <option value="buy">Comprar</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input type="number" value={newQty} onChange={e => setNewQty(Number(e.target.value))}
                  placeholder="Quantidade" className="input-field flex-1" />
                <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))}
                  placeholder="Preço/un" className="input-field flex-1" />
              </div>
              <button onClick={handlePlace} disabled={submitting} className="btn-primary disabled:opacity-30">
                {submitting ? 'Publicando...' : 'PUBLICAR OFERTA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minhas ofertas */}
      {tab === 'minhas' && (
        <div className="px-4 flex flex-col gap-3">
          {myOffers.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">Nenhuma oferta ativa</p>
            </div>
          ) : (
            myOffers.map(o => (
              <div key={o.id} className="bg-surface-card rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {RESOURCE_EMOJI[o.resource_type]} {o.resource_type} · {o.order_type === 'sell' ? 'Venda' : 'Compra'}
                    </p>
                    <p className="text-white/40 text-xs">
                      {formatNumber(o.available_qty)}/{formatNumber(o.quantity)} · {formatMoney(o.price_per_unit)}/un
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                    ${o.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
}