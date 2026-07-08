import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            const secure = process.env.NODE_ENV === 'production'
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure,
              sameSite: 'lax',
              httpOnly: true,
            })
          })
        },
      },
    }
  )

  const url = request.nextUrl
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isGameRoute = url.pathname.startsWith('/game')
  const isAuthRoute = url.pathname.startsWith('/auth')
  const isAdminRoute = url.pathname.startsWith('/admin')
  const isAdminLogin = url.pathname === '/admin/login'

  // 1. Jogador tentando acessar /game sem estar logado → manda para login
  if (isGameRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Jogador logado tentando acessar /auth → manda para home
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/game/home', request.url))
  }

  // 3. ✅ PROTEÇÃO DO ADMIN
  if (isAdminRoute && !isAdminLogin) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/game/home', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/game/:path*', '/auth/:path*', '/admin/:path*'],
}