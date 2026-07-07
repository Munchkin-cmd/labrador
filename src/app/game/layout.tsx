'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import SideMenu from '@/components/menus/SideMenu'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // ✅ Menu aparece em TODAS as páginas
  const showSideMenu = true

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header showMenu={showSideMenu} />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}
      >
        <SideMenu open={false} onClose={() => {}} />
        {children}
      </main>

      <BottomNav />
    </div>
  )
}