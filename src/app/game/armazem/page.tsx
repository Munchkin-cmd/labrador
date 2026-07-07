'use client'

import { useEconomy } from '@/hooks/useMenu'
import { formatNumber, formatMoney } from '@/utils/format'

// ─── ÍCONES DA LUCIDE REACT (Economia e UI) ──────────────────
import { 
  Banknote,       // Dinheiro
  Coins,          // Ouro
  Pickaxe,        // Ferro
  Factory,        // Aço
  Droplet,        // Petróleo
  Flame,          // Carvão
  Trees,          // Madeira
  Atom,           // Urânio
  Wheat,          // Comida
  Zap             // Energia
} from 'lucide-react'

// ─── ÍCONES DO IONICONS (Equipamentos Militares) ─────────────
import { 
  IoDisc,             // Munição
  IoShield,           // Tanques
  IoAirplane,         // Aeronaves
  IoFlame,            // Artilharia
  IoBug,              // Drones
  IoRocket,           // Mísseis
  IoNuclear,          // Ogivas
  IoCog               // Helicópteros (ícone genérico de máquina militar)
} from 'react-icons/io5'

export default function ArmazemPage() {
  const { economy, military, loading } = useEconomy()
  if (loading) return <Loading />

  // ─── RECURSOS (Ícones Lucide) ──────────────────────────────
  const resources = [
    { icon: <Banknote size={20} />, label: 'Dinheiro', value: economy?.money },
    { icon: <Coins size={20} />, label: 'Ouro', value: economy?.gold },
    { icon: <Pickaxe size={20} />, label: 'Ferro', value: economy?.iron },
    { icon: <Factory size={20} />, label: 'Aço', value: economy?.steel },
    { icon: <Droplet size={20} />, label: 'Petróleo', value: economy?.oil },
    { icon: <Flame size={20} />, label: 'Carvão', value: economy?.coal },
    { icon: <Trees size={20} />, label: 'Madeira', value: economy?.wood },
    { icon: <Atom size={20} />, label: 'Urânio', value: economy?.uranium },
    { icon: <Wheat size={20} />, label: 'Comida', value: economy?.food },
    { icon: <Zap size={20} />, label: 'Energia', value: economy?.energy },
  ]

  // ─── EQUIPAMENTOS MILITARES (Ícones Ionicons) ──────────────
  const militaryItems = [
    { icon: <IoDisc size={20} />, label: 'Munição', value: military?.ammunition },
    { icon: <IoShield size={20} />, label: 'Tanques', value: military?.tanks },
    { icon: <IoAirplane size={20} />, label: 'Aeronaves', value: military?.aircraft },
    { icon: <IoFlame size={20} />, label: 'Artilharia', value: military?.artillery },
    { icon: <IoCog size={20} />, label: 'Helicópteros', value: military?.helicopters },
    { icon: <IoBug size={20} />, label: 'Drones', value: military?.drones },
    { icon: <IoRocket size={20} />, label: 'Mísseis', value: military?.missiles },
    { icon: <IoNuclear size={20} />, label: 'Ogivas', value: military?.warheads },
  ]

  return (
    <div className="flex flex-col gap-6 pb-6 p-4">
      {/* Cabeçalho estilo jogo */}
      <p className="text-base font-bold tracking-widest text-white/90 uppercase font-mono">
        ARMAZÉM
      </p>

      {/* ─── RECURSOS ────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-white/40 mb-3 uppercase tracking-widest font-mono">
          RECURSOS
        </p>
        <div className="grid grid-cols-2 gap-3">
          {resources.map((item) => (
            <ItemCard key={item.label} {...item} />
          ))}
        </div>
      </div>

      {/* ─── EQUIPAMENTOS MILITARES ────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-white/40 mb-3 uppercase tracking-widest font-mono">
          EQUIPAMENTOS MILITARES
        </p>
        <div className="grid grid-cols-2 gap-3">
          {militaryItems.map((item) => (
            <ItemCard key={item.label} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE DO CARTÃO (ESTILO EXATO DA IMAGEM) ───────────
function ItemCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number }) {
  // Formatação: Dinheiro usa Money, outros usam Number
  const displayValue = label === 'Dinheiro'
    ? formatMoney(Number(value ?? 0))
    : formatNumber(Number(value ?? 0))

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-4 flex flex-col gap-1 shadow-sm hover:border-white/10 transition-colors">
      {/* Linha superior: Ícone + Nome */}
      <div className="flex items-center justify-between">
        <span className="text-white/80">{icon}</span>
        <span className="text-[10px] font-mono uppercase text-white/70 tracking-widest">
          {label}
        </span>
      </div>
      
      {/* Linha divisória (traço) */}
      <div className="h-px bg-white/10 my-1 w-full" />
      
      {/* Linha inferior: Valor alinhado à direita */}
      <div className="flex justify-end pt-0.5">
        <span className="text-xs font-mono text-white font-bold tracking-wide">
          {displayValue}
        </span>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
