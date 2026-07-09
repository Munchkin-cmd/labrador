import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        // ✅ Proteção contra SSR: se estiver no servidor, retorna array vazio
        if (typeof window === 'undefined') {
          return []
        }
        // Lê todos os cookies do navegador
        const cookies = document.cookie.split('; ').reduce((acc, c) => {
          const [name, value] = c.split('=')
          acc[name] = value
          return acc
        }, {} as Record<string, string>)
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll(cookiesToSet) {
        // ✅ Proteção contra SSR: só executa no navegador
        if (typeof window === 'undefined') return
        cookiesToSet.forEach(({ name, value, options }) => {
          const secure = process.env.NODE_ENV === 'production'
          let cookieStr = `${name}=${value}; path=/;`
          if (options?.maxAge) cookieStr += ` max-age=${options.maxAge};`
          if (secure) cookieStr += ` secure;`
          if (options?.sameSite) cookieStr += ` sameSite=${options.sameSite || 'lax'};`
          if (options?.httpOnly) cookieStr += ` httpOnly;`
          document.cookie = cookieStr
        })
      },
    },
  }
)