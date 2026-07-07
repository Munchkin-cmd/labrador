'use client'
 
import { useState } from 'react'
import SideMenu from '@/components/menus/SideMenu'
 
interface HeaderProps {
  children?: React.ReactNode // ✅ Adicionado para evitar erro de tipagem
}
 
export default function Header({ children }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
 
  return (
    <>
      <header className="header-gradient w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-1.5">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-white text-xl hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Menu"
          >
            ☰
          </button>
 
          <h1 className="text-white font-black text-lg tracking-tight">
            labrador
          </h1>
 
          <div className="w-8" />
        </div>
      </header>
 
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}