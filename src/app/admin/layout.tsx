'use client'

import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pride-red/10 via-pride-yellow/10 to-pride-blue/10">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-6">
        {children}
      </div>
    </div>
  )
}