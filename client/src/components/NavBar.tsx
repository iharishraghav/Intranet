import { useState } from 'react'
import { useNavigate } from 'react-router'

import { signOut, useSession } from '../lib/auth-client'
import './NavBar.css'

function NavBar() {
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
    <header className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">Intranet</span>

        <div className="navbar-user">
          <span className="navbar-name">{session?.user.name}</span>
          <button
            type="button"
            className="navbar-signout"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default NavBar
