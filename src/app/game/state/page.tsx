'use client'

import { useState, useEffect, useRef } from 'react'
import { useCountry } from '@/hooks/useCountry'
import { useParliament } from '@/hooks/useParliament'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { formatMoney, formatNumber, formatPopulation } from '@/utils/format'
import TrustBar from '@/components/home/TrustBar'

// ─── ÍCONES DA LUCIDE REACT (UI, Economia, Política) ─────────
import { 
  Map, Plus, Flag, Crown, 
  Landmark, Users, Coins, TrendingUp, TrendingDown,
  Shield, Gavel, Radiation
} from 'lucide-react'

// ─── ÍCONES DO IONICONS (Equipamentos Militares) ─────────────
import { 
  IoPeople,           // Soldados
  IoDisc,             // Munição
  IoShield,           // Tanques
  IoAirplane,         // Aeronaves
  IoCog,              // Helicópteros
  IoBug,              // Drones
  IoRocket,           // Mísseis
  IoNuclear,          // Ogivas
  IoFlame             // Artilharia
} from 'react-icons/io5'

const TERRAIN_LABELS: Record<string, string> = {
  planicie:   '🌾 Planície',
  orogenico:  '⛰️ Orogênico',
  extremista: '🏜️ Extremista',
  anfibio:    '🌊 Ânfibio',
}

export default function StatePage() {
  const { country } = useAuthStore()
  const { data, economy, profile, loading: loadingC, refetch: refetchCountry } = useCountry()
  const {
    parliament, laws, catalog, loading: loadingP,
    proposeLaw, forceLaw, nextElectionIn, nextRandomIn,
  } = useParliament()

  // ─── BANNER - FOTOS DOS JOGADORES (CARROSSEL COM SENSOR) ──
  const [bannerIndex, setBannerIndex] = useState(0)
  const bannerImages = profile?.banner_urls || []
  const hasBanner = bannerImages.length > 0
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Para e reinicia o timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    if (hasBanner && bannerImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setBannerIndex((prev) => (prev + 1) % bannerImages.length)
      }, 7000)
    }
  }

  // Inicia o timer na montagem
  useEffect(() => {
    startTimer()
    return () => stopTimer()
  }, [bannerImages.length])

  // Navegação manual
  const goToSlide = (index: number) => {
    setBannerIndex(index)
    stopTimer()
    startTimer()
  }

  const goNext = () => {
    setBannerIndex((prev) => (prev + 1) % bannerImages.length)
    stopTimer()
    startTimer()
  }

  const goPrev = () => {
    setBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)
    stopTimer()
    startTimer()
  }

  // Clique nas laterais (sensor)
  const handleBannerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerContainerRef.current || bannerImages.length <= 1) return
    const rect = bannerContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const center = rect.width / 2
    if (x < center) {
      goPrev()
    } else {
      goNext()
    }
  }

  // ✅ Garante que os dados mais recentes (bandeira e banners) sejam carregados
  useEffect(() => {
    if (data?.id) {
      refetchCountry()
    }
  }, [refetchCountry])

  // ─── BUSCAR DADOS MILITARES ──────────────────────────────────
  const [military, setMilitary]     = useState<any>(null)
  const [loadingMil, setLoadingMil] = useState(true)

  useEffect(() => {
    if (!country?.id) return
    supabase.from('military')
      .select('soldiers, tanks, artillery, aircraft, helicopters, drones, ships, submarines, missiles, warheads, ammunition')
      .eq('country_id', country.id)
      .single()
      .then(({ data }) => { setMilitary(data); setLoadingMil(false) })
  }, [country?.id])

  // ─── ESTADO DO PARLAMENTO ────────────────────────────────────
  const [selectedLaw, setSelectedLaw] = useState<number | ''>('')
  const [targetCountryId, setTargetCountryId] = useState<number | null>(null)
  const [proposing, setProposing]     = useState(false)
  const [lawMsg, setLawMsg]           = useState('')
  const [forcing, setForcing]         = useState<string | null>(null)
  const [forceMsg, setForceMsg]       = useState('')

  // ─── ESTADO DAS REGIÕES ──────────────────────────────────────
  const [regions, setRegions] = useState<any[]>([])
  const [buildingsCount, setBuildingsCount] = useState<Record<string, number>>({})
  const [isCreatingRegion, setIsCreatingRegion] = useState(false)
  const [newRegionName, setNewRegionName] = useState('')
  const [regionFeedback, setRegionFeedback] = useState('')
  const [regionLoading, setRegionLoading] = useState(false)

  // ─── BUSCAR REGIÕES ──────────────────────────────────────────
  const fetchRegions = async () => {
    if (!data?.id) return

    const { data: regionsData, error: regionsError } = await supabase
      .from('regions')
      .select('id, name, used_area')
      .eq('country_id', data.id)

    if (regionsError) {
      console.error('❌ Erro ao buscar regiões:', regionsError)
      return
    }

    if (regionsData && regionsData.length > 0) {
      setRegions(regionsData)

      const regionIds = regionsData.map((r: any) => r.id)
      if (regionIds.length > 0) {
        const { data: buildingsData } = await supabase
          .from('buildings')
          .select('region_id, quantity')
          .in('region_id', regionIds)

        if (buildingsData) {
          const count: Record<string, number> = {}
          buildingsData.forEach((b: any) => {
            count[b.region_id] = (count[b.region_id] || 0) + b.quantity
          })
          setBuildingsCount(count)
        }
      }
    } else {
      setRegions([])
    }
  }

  useEffect(() => {
    fetchRegions()
  }, [data?.id])

  // ─── CRIAR NOVA REGIÃO ──────────────────────────────────────
  async function handleCreateRegion() {
    if (!data?.id || !newRegionName.trim()) return

    setRegionLoading(true)
    setRegionFeedback('')

    const { data: result, error } = await supabase
      .rpc('create_region', {
        p_country_id: data.id,
        p_name: newRegionName.trim(),
        p_area_km2: 300000
      }) as { data: { success: boolean; error?: string } | null; error: any }

    if (error) {
      setRegionFeedback(`❌ Erro: ${error.message}`)
    } else if (result && !result.success) {
      setRegionFeedback(`❌ ${result.error || 'Erro ao criar região'}`)
    } else {
      setRegionFeedback('✅ Região criada com sucesso!')
      await fetchRegions()
      setIsCreatingRegion(false)
      setNewRegionName('')
    }

    setRegionLoading(false)
  }

  // ─── CRONÔMETRO DA LEI (SUBSTITUTO DO formatCountdown) ──────
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const getCountdown = (lawId: string) => {
    const law = laws.find(l => l.id === lawId)
    if (!law || !law.created_at) return '--:--'
    
    const deadline = new Date(new Date(law.created_at).getTime() + 5 * 60 * 1000)
    const now = new Date()
    const diff = Math.max(0, deadline.getTime() - now.getTime())
    
    if (diff === 0) return 'Votação encerrada'
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (loadingC || loadingP) return <PageLoading />
  if (!data || !economy || !parliament) return null

  const coalition_pct  = Math.round((parliament.coalition_seats / parliament.total_seats) * 100)
  const has_majority   = parliament.coalition_seats > parliament.total_seats / 2

  async function handlePropose() {
    if (!selectedLaw) return
    setProposing(true); setLawMsg('')
    const res = await proposeLaw(Number(selectedLaw), targetCountryId)
    setLawMsg(res.message ?? res.error ?? 'Erro')
    setSelectedLaw('')
    setTargetCountryId(null)
    setProposing(false)
  }

  async function handleForce(lawId: string) {
    setForcing(lawId); setForceMsg('')
    const res = await forceLaw(lawId)
    setForceMsg(res.message ?? res.error ?? 'Erro')
    setForcing(null)
  }

  const pendingLaws  = laws.filter(l => l.status === 'pending')
  const activeLaws   = laws.filter(l => l.status === 'active')
  const rejectedLaws = laws.filter(l => l.status === 'revoked').slice(0, 5)

  return (
    <div className="flex flex-col gap-5 pb-8 w-full max-w-4xl mx-auto overflow-x-hidden">
      
      {/* ─── BANNER COM FOTOS DOS JOGADORES (TAMANHO ORIGINAL h-48) ── */}
      <div 
        ref={bannerContainerRef}
        onClick={handleBannerClick}
        className={`relative h-48 w-full overflow-hidden rounded-xl mx-4 bg-black/40 border border-white/10 ${hasBanner && bannerImages.length > 1 ? 'cursor-pointer' : ''}`}
      >
        {hasBanner ? (
          <>
            <img 
              src={bannerImages[bannerIndex]} 
              alt="Banner do país"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            />
            
            {/* Indicadores (bolinhas) */}
            {bannerImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {bannerImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); goToSlide(idx) }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === bannerIndex ? 'bg-primary w-4' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
            Nenhuma foto no banner
          </div>
        )}
      </div>
 
      {/* ─── CABEÇALHO: BANDEIRA + NOME + CAPITAL + LEMA ── */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="flex items-end gap-4">
          <div className="w-20 h-16 rounded-lg border-2 border-primary shadow-lg shadow-primary/20 overflow-hidden flex-shrink-0 bg-black/80">
            {profile?.flag_url ? (
              <img src={profile.flag_url} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-white/30">
                <Flag size={36} />
              </div>
            )}
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-bold text-white">{data.name}</h2>
            <p className="text-white/50 text-sm">Capital: {data.capital}</p>
            {data.motto && (
              <p className="text-white/30 text-xs italic mt-0.5">"{data.motto}"</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── INFORMAÇÕES DO PAÍS ── */}
      <Section title={<span className="flex items-center gap-2"><Landmark size={16} /> INFORMAÇÕES</span>}>
        <InfoRow label="Título" value={`${data.leader_title}${data.leader_name ? ': ' + data.leader_name : ''}`} />
        <InfoRow label="Estrutura" value={data.state_structure || 'Democracia'} />
        <InfoRow label="Religião"  value={data.religion || 'Sem religião oficial'} />
        <InfoRow label="Moeda"     value={data.currency || 'NF ($)'} />
        <InfoRow label="Terreno"   value={data.terrain ? data.terrain.charAt(0).toUpperCase() + data.terrain.slice(1) : 'Planície'} />
      </Section>

      {/* ─── TABELA DE REGIÕES + BOTÃO CRIAR REGIÃO ────────── */}
      <div className="px-4">
        <div className="bg-surface-card rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white/40 text-xs font-bold tracking-widest uppercase">
              <Map size={16} /> REGIÕES ({regions.length})
            </div>
            <button
              onClick={() => setIsCreatingRegion(true)}
              className="text-xs bg-primary hover:bg-primary-light text-white px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> CRIAR
            </button>
          </div>

          {/* Modal de Criação de Região */}
          {isCreatingRegion && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-card rounded-xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <Map size={20} /> Criar Nova Região
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  Digite o nome da nova região. O custo é de R$ 150.000.000 (padrão).
                </p>
                <input
                  type="text"
                  placeholder="Ex: Província do Norte"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  className="input-field mb-3"
                  disabled={regionLoading}
                />
                {regionFeedback && (
                  <p className={`text-sm mb-3 text-center ${regionFeedback.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {regionFeedback}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateRegion}
                    disabled={regionLoading || !newRegionName.trim()}
                    className="flex-1 bg-primary hover:bg-primary-light disabled:opacity-30 text-white font-bold py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} /> {regionLoading ? 'Criando...' : 'Criar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingRegion(false)
                      setNewRegionName('')
                      setRegionFeedback('')
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Regiões */}
          {regions.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">Nenhuma região cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs border-b border-white/5">
                    <th className="text-left py-2 font-medium">Região</th>
                    <th className="text-right py-2 font-medium">Km² usados</th>
                    <th className="text-right py-2 font-medium">Edifícios</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region: any) => (
                    <tr key={region.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 text-white font-medium">{region.name}</td>
                      <td className="py-2 text-white/70 text-right">{region.used_area || 0}</td>
                      <td className="py-2 text-white/70 text-right">{buildingsCount[region.id] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── STATUS POLÍTICO ── */}
      <Section title={<span className="flex items-center gap-2"><Shield size={16} /> STATUS POLÍTICO</span>}>
        <div className="flex flex-col gap-2">
          <TrustBar trust={data.trust || 50} label="Confiança" color="bg-green-500" />
          <TrustBar trust={data.intl_approval || 50} label="Aprovação" color="bg-blue-400" />
          <TrustBar trust={data.political_power || 50} label="Poder Pol." color="bg-purple-400" />
        </div>
      </Section>

      {/* ─── PARLAMENTO ── */}
      <Section title={<span className="flex items-center gap-2"><Users size={16} /> PARLAMENTO</span>}>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f1f1f" strokeWidth="3.8" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EF4444" strokeWidth="3.8" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="#22C55E" strokeWidth="3.8"
                strokeDasharray={`${coalition_pct} ${100 - coalition_pct}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span style={{ color: 'white', fontWeight: 900, fontSize: 13 }}>{parliament.total_seats}</span>
              <span style={{ color: '#444', fontSize: 9 }}>assentos</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ color: '#aaa', fontSize: 13 }}>Coalizão</span>
              </div>
              <span style={{ color: '#22C55E', fontWeight: 800, fontSize: 13 }}>
                {parliament.coalition_seats} ({coalition_pct}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ color: '#aaa', fontSize: 13 }}>Oposição</span>
              </div>
              <span style={{ color: '#EF4444', fontWeight: 800, fontSize: 13 }}>
                {parliament.opposition_seats} ({100 - coalition_pct}%)
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${has_majority ? 'badge-green' : 'badge-red'}`}>
                {has_majority ? '✅ Maioria Coalizão' : '⚠️ Maioria Oposição'}
              </span>
            </div>
          </div>
        </div>

        <div className="progress-track mb-3">
          <div className="progress-fill" style={{ width: `${coalition_pct}%`, background: '#22C55E' }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="card-sm">
            <p style={{ color: '#444', fontSize: 10 }}>Próxima Eleição</p>
            <p style={{ color: '#ccc', fontWeight: 700, fontSize: 13 }}>{nextElectionIn()}</p>
            <p style={{ color: '#333', fontSize: 10 }}>
              {parliament.election_type === 'random' ? '🎲 Último: sorteio' : '📊 Último: confiança'}
            </p>
          </div>
          <div className="card-sm">
            <p style={{ color: '#444', fontSize: 10 }}>Eleição Aleatória</p>
            <p style={{ color: '#ccc', fontWeight: 700, fontSize: 13 }}>{nextRandomIn()}</p>
            <p style={{ color: '#333', fontSize: 10 }}>A cada 2 dias</p>
          </div>
        </div>
      </Section>

      {/* ─── PROPOR LEI ── */}
      <Section title={<span className="flex items-center gap-2"><Gavel size={16} /> PROPOR LEI</span>}>
        <p style={{ color: '#444', fontSize: 12, marginBottom: 10 }}>
          O robô parlamentar vota automaticamente em 5 minutos.
          Confiança atual: <span style={{ color: '#22C55E', fontWeight: 700 }}>{data.trust}%</span>
        </p>

        <select
          value={selectedLaw}
          onChange={e => setSelectedLaw(e.target.value as any)}
          className="input-field"
          style={{ marginBottom: 10 }}
        >
          <option value="">Selecionar lei...</option>
          {catalog.map(l => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.political_power_cost} poder político
            </option>
          ))}
        </select>

        {/* ✅ SELETOR DE PAÍS ALVO (para leis que precisam de alvo: guerra, sanções, etc.) */}
        {selectedLaw && [8, 9, 10].includes(Number(selectedLaw)) && (
          <div className="mb-3">
            <p className="text-white/60 text-xs mb-1">Selecionar país alvo:</p>
            <select
              value={targetCountryId || ''}
              onChange={e => setTargetCountryId(Number(e.target.value) || null)}
              className="input-field"
            >
              <option value="">Escolha um país...</option>
              {/* Aqui você deve preencher com a lista de países. Exemplo: */}
              <option value={1}>Africa Austral</option>
              <option value={14}>Brasil</option>
            </select>
          </div>
        )}

        {lawMsg && (
          <p style={{
            fontSize: 13, marginBottom: 10, textAlign: 'center',
            color: lawMsg.includes('✅') || lawMsg.includes('proposta') ? '#22C55E' : '#EF4444',
          }}>
            {lawMsg}
          </p>
        )}

        <button 
          onClick={handlePropose} 
          disabled={!selectedLaw || proposing || !data?.is_active}
          className="btn-primary"
          style={{ 
            opacity: (!selectedLaw || proposing || !data?.is_active) ? 0.4 : 1 
          }}
        >
          {!data?.is_active ? 'NPCs não propõem leis' : (proposing ? 'Propondo...' : '⚖️ PROPOR LEI')}
        </button>
      </Section>

      {/* ── LEIS PENDENTES ── */}
      {pendingLaws.length > 0 && (
        <Section title={<span className="flex items-center gap-2"><Users size={16} /> EM VOTAÇÃO</span>}>
          {pendingLaws.map(law => (
            <div key={law.id} className="card-sm" style={{ marginBottom: 8 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p style={{ color: '#e0e0e0', fontWeight: 700, fontSize: 13 }}>
                    {law.law_catalog?.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span style={{ color: '#22C55E', fontSize: 11 }}>👍 {law.votes_for}</span>
                    <span style={{ color: '#EF4444', fontSize: 11 }}>👎 {law.votes_against}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {/* ✅ CRONÔMETRO CORRIGIDO */}
                  <span className="badge badge-yellow">⏱️ {getCountdown(law.id)}</span>
                </div>
              </div>
              <div className="progress-track" style={{ marginTop: 8 }}>
                <div className="progress-fill"
                  style={{ width: `${coalition_pct}%`, background: has_majority ? '#22C55E' : '#EF4444' }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── LEIS REJEITADAS (pode forçar) ── */}
      {rejectedLaws.length > 0 && (
        <Section title={<span className="flex items-center gap-2"><Gavel size={16} /> LEIS REJEITADAS</span>}>
          <p style={{ color: '#444', fontSize: 12, marginBottom: 10 }}>
            Você pode forçar a aprovação gastando <span style={{ color: '#8B5CF6' }}>50 poder político</span>.
            <span style={{ color: '#EF4444' }}> Não é possível forçar Ogiva Nuclear.</span>
          </p>
          {forceMsg && (
            <p style={{ fontSize: 13, marginBottom: 10, textAlign: 'center', color: forceMsg.includes('✅') ? '#22C55E' : '#EF4444' }}>
              {forceMsg}
            </p>
          )}
          {rejectedLaws.map(law => (
            <div key={law.id} className="card-sm" style={{ marginBottom: 8 }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p style={{ color: '#e0e0e0', fontWeight: 700, fontSize: 13 }}>
                    {law.law_catalog?.name}
                  </p>
                  <p style={{ color: '#444', fontSize: 11 }}>
                    {law.votes_for} a favor · {law.votes_against} contra
                  </p>
                </div>
                <button
                  onClick={() => handleForce(law.id)}
                  disabled={forcing === law.id || data.political_power < 50 || law.law_catalog_id === 9}
                  style={{
                    background: '#4C1D95', color: 'white', border: 'none',
                    borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', flexShrink: 0,
                    opacity: forcing === law.id || data.political_power < 50 || law.law_catalog_id === 9 ? 0.35 : 1,
                  }}
                >
                  {forcing === law.id ? '...' : '⚡ Forçar (50)'}
                </button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── LEIS ATIVAS ── */}
      {activeLaws.length > 0 && (
        <Section title={<span className="flex items-center gap-2"><Landmark size={16} /> LEIS ATIVAS</span>}>
          {activeLaws.map(law => (
            <div key={law.id} className="card-sm" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p style={{ color: '#e0e0e0', fontWeight: 700, fontSize: 13 }}>{law.law_catalog?.name}</p>
                <p style={{ color: '#444', fontSize: 11 }}>
                  {law.forced_approval ? '⚡ Aprovada por força política' : '✅ Aprovada pelo parlamento'}
                </p>
              </div>
              <span className="badge badge-green">Ativa</span>
            </div>
          ))}
        </Section>
      )}

      {/* ─── ECONÔMICO ── */}
      <Section title={<span className="flex items-center gap-2"><Coins size={16} /> ESTATÍSTICAS ECONÔMICAS</span>}>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Dinheiro"   value={formatMoney(Number(economy.money || 0))} icon={<Coins size={20} />} />
          <StatCard label="Inflação"   value={`${(Number(economy.inflation || 0) * 100).toFixed(1)}%`} icon={<TrendingUp size={20} />} />
          <StatCard label="Exportação" value={formatMoney(Number(economy.exports || 0))} icon={<TrendingUp size={20} />} />
          <StatCard label="Importação" value={formatMoney(Number(economy.imports || 0))} icon={<TrendingDown size={20} />} />
          <StatCard label="Receitas"   value={formatMoney(Number(economy.revenue || 0))} icon={<TrendingUp size={20} />} />
          <StatCard label="Despesas"   value={formatMoney(Number(economy.expenses || 0))} icon={<TrendingDown size={20} />} />
          <StatCard label="População"  value={formatPopulation(Number(economy.population || 0))} icon={<Users size={20} />} />
          <StatCard label="Poluição"   value={`${Number(economy.pollution || 0).toFixed(0)}%`} icon={<Radiation size={20} />} />
        </div>
      </Section>

      {/* ─── MILITAR ── */}
      <Section title={<span className="flex items-center gap-2"><Shield size={16} /> EQUIPAMENTOS MILITARES</span>}>
        {loadingMil ? (
          <div className="flex justify-center py-4"><div className="spinner" style={{ width: 20, height: 20 }} /></div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <IoPeople size={24} className="text-white/60" />, label: 'Soldados', key: 'soldiers' },
              { icon: <IoDisc size={24} className="text-white/60" />, label: 'Munição', key: 'ammunition' },
              { icon: <IoShield size={24} className="text-white/60" />, label: 'Tanques', key: 'tanks' },
              { icon: <IoAirplane size={24} className="text-white/60" />, label: 'Aeronaves', key: 'aircraft' },
              { icon: <IoCog size={24} className="text-white/60" />, label: 'Helicópteros', key: 'helicopters' },
              { icon: <IoBug size={24} className="text-white/60" />, label: 'Drones', key: 'drones' },
              { icon: <IoRocket size={24} className="text-white/60" />, label: 'Mísseis', key: 'missiles' },
              { icon: <IoNuclear size={24} className="text-white/60" />, label: 'Ogivas', key: 'warheads' },
              { icon: <IoFlame size={24} className="text-white/60" />, label: 'Artilharia', key: 'artillery' },
            ].map(({ icon, label, key }) => (
              <div key={key} className="bg-surface rounded-xl p-2.5 flex flex-col items-center gap-1">
                {icon}
                <span className="text-white font-bold text-sm">{formatNumber(Number(military?.[key] ?? 0))}</span>
                <span className="text-white/40 text-xs">{label}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  )
}

// ─── COMPONENTES REFORMULADOS ────────────────────────────────

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-4 flex flex-col gap-3">
      <p className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-2">
        {title}
      </p>
      <div className="bg-surface-card rounded-xl p-3">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl p-3 flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-white/40">{icon}</span>}
        <span className="text-white font-bold text-base">{value}</span>
      </div>
      <span className="text-white/40 text-xs">{label}</span>
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