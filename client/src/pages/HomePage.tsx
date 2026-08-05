import { useEffect, useState } from 'react'

import { useSession } from '../lib/auth-client'
import './HomePage.css'

type ApiStatus =
  | { state: 'checking' }
  | { state: 'ok'; status: string }
  | { state: 'error'; message: string }

interface HealthResponse {
  status: string
}

function HomePage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<ApiStatus>({ state: 'checking' })

  useEffect(() => {
    let active = true

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        return response.json() as Promise<HealthResponse>
      })
      .then((health) => {
        if (active) setStatus({ state: 'ok', status: health.status })
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus({
            state: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <h1>Welcome, {session?.user.name}</h1>
      <p className="tagline">
        Internal web application for organization-wide communication.
      </p>

      <section className="status" aria-live="polite">
        <h2>API connection</h2>
        {status.state === 'checking' && <p>Checking&hellip;</p>}
        {status.state === 'ok' && (
          <p className="status-ok">Connected &mdash; server status: {status.status}</p>
        )}
        {status.state === 'error' && (
          <p className="status-error">
            Not connected &mdash; {status.message}. Is the server running on port
            3000?
          </p>
        )}
      </section>
    </>
  )
}

export default HomePage
