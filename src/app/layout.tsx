import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { AuthProvider } from '@/context/AuthContext'
// ✅ REMOVIDO: BottomNav também (será renderizado no game/layout.tsx)

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Labrador',
  description: 'O jogo de estratégia geopolítica',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-surface text-white`}>
        <AuthProvider>
          {/* ✅ AQUI APENAS O CONTEÚDO — sem Header, sem BottomNav */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
