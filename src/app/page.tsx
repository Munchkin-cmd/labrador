import { redirect } from 'next/navigation'

// Redirect / to /auth/login
// The auth layout will check session and redirect to /game/home if logged in
export default function RootPage() {
  redirect('/auth/login')
}
