'use client'

import { ReactNode } from 'react'

interface AdminCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  color?: 'primary' | 'green' | 'red' | 'yellow'
}

export default function AdminCard({ 
  title, 
  value, 
  icon, 
  description, 
  color = 'primary' 
}: AdminCardProps) {
  const colorMap = {
    primary: 'bg-primary/20 border-primary/20 text-primary-light',
    green: 'bg-green-500/20 border-green-500/20 text-green-400',
    red: 'bg-red-500/20 border-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/20 text-yellow-400',
  }

  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]} bg-[#1a1a1a]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/60 text-xs font-bold tracking-widest uppercase">{title}</div>
        <div className="text-white/60">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {description && (
        <div className="text-white/40 text-xs mt-1">{description}</div>
      )}
    </div>
  )
}