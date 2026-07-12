'use client'

import { CountryFull, UserProfile } from '@/hooks/useCountry'
import Image from 'next/image'

interface Props {
  country: CountryFull
  profile: UserProfile
}

export default function CountryBanner({ country, profile }: Props) {
  // ✅ FUNDO DA HOME: Usa a bandeira do país (profile.flag_url)
  const backgroundImage = profile.flag_url ?? null

  return (
    <div className="relative w-full h-40 bg-gradient-to-br from-primary-dark to-secondary-dark overflow-hidden">
      {/* Fundo: Bandeira */}
      {backgroundImage ? (
        <Image src={backgroundImage} alt="Bandeira" fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/60" />
      )}

      {/* Overlay escuro para dar contraste ao texto */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Conteúdo */}
      <div className="absolute inset-0 flex items-end p-4 gap-3">
        
        {/* ✅ MOLDURA CIRCULAR: Foto do Líder */}
        <div className="w-14 h-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex-shrink-0">
          {profile.leader_url ? (
            <Image src={profile.leader_url} alt="Líder" width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
          )}
        </div>

        {/* Informações do país */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{country.flag_emoji}</span>
            <h2 className="text-white font-black text-lg leading-tight truncate">{country.name}</h2>
          </div>
          {country.motto && (
            <p className="text-white/60 text-xs italic truncate mt-0.5">"{country.motto}"</p>
          )}
          <p className="text-white/40 text-xs mt-0.5">
            {country.leader_title}{country.leader_name ? `: ${country.leader_name}` : ''} · {country.capital}
          </p>
        </div>
      </div>
    </div>
  )
}
