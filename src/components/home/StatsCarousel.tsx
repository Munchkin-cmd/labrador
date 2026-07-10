'use client'

import { useState, useEffect, useRef } from 'react'
import { WorldStats } from '@/hooks/useWorldStats'
import { CountryFull, Economy } from '@/hooks/useCountry'
import { formatMoney, formatNumber, formatPopulation } from '@/utils/format'

// ── World Stats ─────────────────────────────────────────────
interface WorldProps { stats: WorldStats }

export function WorldStatsCarousel({ stats }: WorldProps) {
  const slides = [
    [
      { label: 'Países',      value: formatNumber(stats.total_countries) },
      { label: 'Ativos',      value: formatNumber(stats.active_countries) },
      { label: 'Regiões',     value: formatNumber(stats.total_regions) },
    ],
    [
      { label: 'Edifícios',   value: formatNumber(stats.total_buildings) },
      { label: 'Dinheiro',    value: formatMoney(stats.total_money) },
      { label: 'População',   value: formatPopulation(stats.total_population) },
    ],
  ]
  return <StatsCarousel label="ESTATÍSTICAS MUNDIAIS" slides={slides} accent="text-yellow-400" />
}

// ── Country Stats ────────────────────────────────────────────
interface CountryProps { country: CountryFull; economy: Economy }

export function CountryStatsCarousel({ country, economy }: CountryProps) {
  const slides = [
    [
      { label: 'Dinheiro',    value: formatMoney(Number(economy.money)) },
      { label: 'Confiança',   value: `${country.trust}%` },
      { label: 'Aprovação',   value: `${country.intl_approval}%` },
    ],
    [
      { label: 'Poder Pol.',  value: `${country.political_power}` },
      { label: 'Regiões',     value: formatNumber(country.total_regions) },
      { label: 'Energia',     value: formatNumber(Number(economy.energy)) },
    ],
    [
      { label: 'Comida',      value: formatNumber(Number(economy.food)) },
      { label: 'Ouro',        value: formatNumber(Number(economy.gold)) },
      { label: 'Pop.',        value: formatPopulation(Number(economy.population)) },
    ],
    [
      { label: 'Petróleo',    value: formatNumber(Number(economy.oil)) },
      { label: 'Ferro',       value: formatNumber(Number(economy.iron)) },
      { label: 'Aço',         value: formatNumber(Number(economy.steel)) },
    ],
    [
      { label: 'Madeira',     value: formatNumber(Number(economy.wood)) },
      { label: 'Carvão',      value: formatNumber(Number(economy.coal)) },
      { label: 'Urânio',      value: formatNumber(Number(economy.uranium)) },
    ],
  ]
  return <StatsCarousel label={`🌍 ${country.name.toUpperCase()}`} slides={slides} accent="text-primary-light" />
}

// ── Base Carousel ────────────────────────────────────────────
interface Stat { label: string; value: string }

interface CarouselProps {
  label: string
  slides: Stat[][]
  accent: string
}

function StatsCarousel({ label, slides, accent }: CarouselProps) {
  const [current, setCurrent] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Função para iniciar o timer
  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent((prev: number) => (prev + 1) % slides.length)
    }, 5000)
  }

  // Função para parar o timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Inicia o timer quando o componente monta e o slides mudam
  useEffect(() => {
    startTimer()
    return () => stopTimer()
  }, [slides.length])

  // Funções de navegação manual (com reset do timer)
  const goToSlide = (index: number) => {
    setCurrent(index)
    stopTimer()
    startTimer()
  }

  const goNext = () => {
    setCurrent((prev: number) => (prev + 1) % slides.length)
    stopTimer()
    startTimer()
  }

  const goPrev = () => {
    setCurrent((prev: number) => (prev - 1 + slides.length) % slides.length)
    stopTimer()
    startTimer()
  }

  // Navegação via clique nas laterais
  const handleSlideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left // Posição do clique dentro do container
    const center = rect.width / 2

    if (x < center) {
      goPrev() // Clicou na metade esquerda → Volta
    } else {
      goNext() // Clicou na metade direita → Avança
    }
  }

  return (
    <div className="px-4">
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold tracking-widest text-white/40 uppercase">{label}</p>
        {/* Dots */}
        <div className="flex gap-1">
          {slides.map((_, i: number) => (
            <button key={i} onClick={() => goToSlide(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? `${accent} bg-current` : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      {/* Slide Container (clique na lateral para navegar) */}
      <div
        ref={containerRef}
        onClick={handleSlideClick}
        className="relative cursor-pointer"
      >
        <div className="bg-surface-card rounded-xl p-3 grid grid-cols-3 gap-2 pointer-events-none">
          {slides[current].map((stat: Stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className={`text-base font-black ${accent}`}>{stat.value}</span>
              <span className="text-white/40 text-xs mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}