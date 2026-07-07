'use client'

import { useAuthStore } from '@/store/authStore'
import { useCountry } from '@/hooks/useCountry'
import { useWorldStats } from '@/hooks/useWorldStats'
import CountryBanner from '@/components/home/CountryBanner'
import { WorldStatsCarousel, CountryStatsCarousel } from '@/components/home/StatsCarousel'
import GlobalChat from '@/components/home/GlobalChat'
import TrustBar from '@/components/home/TrustBar'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: country, economy, profile, loading: loadingCountry } = useCountry()
  const { stats, loading: loadingWorld } = useWorldStats()

  useEffect(() => {
    if (!user) router.replace('/auth/login')
  }, [user, router])

  if (loadingCountry) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!country || !economy || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-white/60 text-sm mb-3">Não foi possível carregar os dados do país.</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm py-2 px-4 w-auto">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Banner principal ── */}
      <CountryBanner country={country} profile={profile} />

      {/* ── Barras de status ── */}
      <div className="px-4 flex flex-col gap-2">
        <TrustBar trust={country.trust}         label="Confiança"   color="bg-green-500" />
        <TrustBar trust={country.intl_approval} label="Aprovação"   color="bg-blue-400" />
        <TrustBar trust={country.political_power} label="Poder Pol." color="bg-purple-400" />
      </div>

      {/* ── Separador ── */}
      <Divider />

      {/* ── Stats mundiais ── */}
      {stats && !loadingWorld ? (
        <WorldStatsCarousel stats={stats} />
      ) : (
        <StatsSkeleton />
      )}

      {/* ── Separador ── */}
      <Divider />

      {/* ── Stats do país ── */}
      <CountryStatsCarousel country={country} economy={economy} />

      {/* ── Separador ── */}
      <Divider />

      {/* ── Chat Global ── */}
      <GlobalChat />

    </div>
  )
}

function Divider() {
  return <div className="h-px bg-white/5 mx-4" />
}

function StatsSkeleton() {
  return (
    <div className="px-4">
      <div className="h-3 w-32 bg-white/10 rounded mb-3 animate-pulse" />
      <div className="bg-surface-card rounded-xl p-3 grid grid-cols-3 gap-2">
        {[1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-5 w-12 bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-8 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
