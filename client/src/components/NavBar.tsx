import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'

export default function NavBar() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

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
        <span className="font-heading font-semibold">Intranet</span>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{session?.user.name}</span>
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
