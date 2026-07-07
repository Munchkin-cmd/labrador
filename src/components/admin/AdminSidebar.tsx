'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, Globe, Shield, 
  Power, AlertCircle 
} from 'lucide-react'

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Jogadores', href: '/admin/players', icon: Users },
  { label: 'Controle do Mundo', href: '/admin/world-control', icon: Globe },
  { label: 'Logs do Sistema', href: '/admin/logs', icon: AlertCircle },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#111] border-r border-white/10 flex flex-col z-50">
      
      {/* Cabeçalho com gradiente arco-íris */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-pride-red via-pride-yellow to-pride-blue">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
          <Shield size={20} /> ADMIN
        </h1>
        <p className="text-white/80 text-xs mt-1 font-medium">Painel de Controle</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${isActive 
                  ? 'bg-gradient-to-r from-pride-red/20 via-pride-yellow/20 to-pride-blue/20 border border-white/20 text-white' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/game/home"
          className="flex items-center gap-3 px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
        >
          <Power size={16} />
          Voltar ao Jogo
        </Link>
      </div>
    </aside>
  )
}