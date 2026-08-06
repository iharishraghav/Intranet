import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { HealthResponse } from 'core/api-types'
import { apiStatusLabels } from 'core/constants'
import { errorMessages, statusMessages } from 'core/messages'

export default function ApiStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<HealthResponse>('/health', { signal })
      return data
    },
  })

  const status = health.isSuccess
    ? {
        label: apiStatusLabels.ok,
        detail: statusMessages.apiConnected(health.data.status),
        tone: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-600 dark:bg-emerald-400',
      }
    : health.isError
      ? {
          label: apiStatusLabels.down,
          detail: errorMessages.apiDisconnected(health.error.message),
          tone: 'text-destructive',
          dot: 'bg-destructive',
        }
      : {
          label: statusMessages.apiChecking,
          detail: statusMessages.apiChecking,
          tone: 'text-muted-foreground',
          dot: 'bg-muted-foreground',
        }

  return (
    <span
      className={cn('hidden items-center gap-2 text-xs font-medium sm:inline-flex', status.tone)}
      title={status.detail}
      aria-live="polite"
    >
      <span className={cn('size-2 shrink-0 rounded-full', status.dot)} aria-hidden="true" />
      {status.label}
    </span>
  )
}
