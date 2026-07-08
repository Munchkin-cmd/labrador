import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createClient() {
  try {
    const cookieStore = cookies()
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // ✅ Aplica as flags de segurança para ambientes HTTPS
                const secure = process.env.NODE_ENV === 'production';
                cookieStore.set(name, value, { 
                  ...options, 
                  secure, 
                  sameSite: 'lax',
                  httpOnly: true
                });
              })
            } catch {
              // O setAll pode falhar se for chamado em um Server Component
            }
          },
        },
      }
    )
  } catch (error) {
    // Fallback para modo API (sem cookies)
    console.warn('⚠️ API mode: criando cliente sem cookies().')
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // Ignora setAll em modo API
          },
        },
      }
    )
  }
}