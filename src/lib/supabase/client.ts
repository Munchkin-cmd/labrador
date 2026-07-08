import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // ✅ Aplica as flags de segurança para ambientes HTTPS
          const secure = process.env.NODE_ENV === 'production';
          document.cookie = `${name}=${value}; path=/; secure=${secure}; sameSite=lax; max-age=${options?.maxAge ?? 3600}`;
        });
      },
    },
  }
)
