import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useSession } from '@/lib/auth-client'
import type { HealthResponse } from '@core/api-types'
import { errorMessages, statusMessages } from '@core/messages'

export default function HomePage() {
  const { data: session } = useSession()
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<HealthResponse>('/health', { signal })
      return data
    },
  })

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
          {health.isPending && (
            <p className="text-muted-foreground">{statusMessages.apiChecking}</p>
          )}
          {health.isSuccess && (
            <p className="text-emerald-600 dark:text-emerald-400">
              {statusMessages.apiConnected(health.data.status)}
            </p>
          )}
          {health.isError && (
            <p className="text-destructive">
              {errorMessages.apiDisconnected(health.error.message)}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
