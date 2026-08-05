import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useSession } from '@/lib/auth-client'

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
      <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
        Welcome, {session?.user.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Internal web application for organization-wide communication.
      </p>

      <Card className="mt-8" aria-live="polite">
        <CardHeader>
          <h2 className="font-heading text-base leading-snug font-medium">API connection</h2>
        </CardHeader>
        <CardContent>
          {status.state === 'checking' && (
            <p className="text-muted-foreground">Checking&hellip;</p>
          )}
          {status.state === 'ok' && (
            <p className="text-emerald-600 dark:text-emerald-400">
              Connected &mdash; server status: {status.status}
            </p>
          )}
          {status.state === 'error' && (
            <p className="text-destructive">
              Not connected &mdash; {status.message}. Is the server running on port
              3000?
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default HomePage
