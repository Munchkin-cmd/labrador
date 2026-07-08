'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* ✅ Header SEM showMenu */}
      <Header />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}
      >
        {/* ✅ Removido o SideMenu extra. O Header já renderiza ele. */}
        {children}
      </main>

      <BottomNav />
    </div>
  )
}