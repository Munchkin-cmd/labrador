'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import SideMenu from '@/components/menus/SideMenu'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // ✅ Pode manter essa variável, mas não passe ela para o Header
  const showSideMenu = pathname.startsWith('/game/home') || pathname.startsWith('/game/state')

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* ✅ Header SEM showMenu */}
      <Header />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}
      >
        {/* Opcional: Se quiser renderizar o SideMenu aqui, pode descomentar */}
        {/* {showSideMenu && <SideMenu open={false} onClose={() => {}} />} */}
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
