// 🚀 Versão final corrigida
'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

// ... (o resto do seu código sem o showMenu) 

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Você pode manter essa variável para outras coisas, mas NÃO passe ela para o Header
  const showSideMenu = pathname.startsWith('/game/home') || pathname.startsWith('/game/state')

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* ✅ HEADER SEM showMenu */}
      <Header />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
