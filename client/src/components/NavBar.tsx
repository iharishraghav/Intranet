import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import ApiStatus from '@/components/ApiStatus'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'
import { roles } from 'core/constants'

export default function NavBar() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [signingOut, setSigningOut] = useState(false)

  const isAdmin = session?.user.role === roles.admin
  const isAdminPage = pathname === '/admin'
  const showAdminLink = isAdmin && !isAdminPage

  async function handleSignOut() {
    setSigningOut(true)

    await signOut({
      fetchOptions: {
        onSuccess: () => {
          void navigate('/login', { replace: true })
        },
      },
    })

    setSigningOut(false)
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/" className="font-heading font-semibold">
          Intranet
        </Link>

        <div className="flex items-center gap-3">
          {isAdmin && isAdminPage && <ApiStatus />}
          {showAdminLink && (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/admin" />}>
              Admin dashboard
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </div>
    </header>
  )
}
