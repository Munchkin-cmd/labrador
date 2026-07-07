// Layout for unauthenticated pages (login, register)
// No header or nav — full screen centered with floating flags
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // 28 bandeiras de países em emoji (inspiradas no relatório)
  const flags = [
    '🇧🇷', '🇺🇸', '🇩🇪', '🇫🇷', '🇬🇧', '🇮🇹', '🇪🇸', '🇵🇹', '🇷🇺', '🇨🇳',
    '🇯🇵', '🇰🇷', '🇮🇳', '🇦🇷', '🇲🇽', '🇨🇦', '🇦🇺', '🇿🇦', '🇪🇬', '🇸🇦',
    '🇹🇷', '🇬🇷', '🇳🇱', '🇧🇪', '🇸🇪', '🇳🇴', '🇩🇰', '🇵🇱'
  ]

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Camada de fundo com bandeiras flutuantes */}
      <div className="absolute inset-0 z-0">
        {flags.map((flag, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-20 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 15}s`,
              fontSize: `${2 + Math.random() * 4}rem`,
            }}
          >
            {flag}
          </div>
        ))}
      </div>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </main>
  )
}
