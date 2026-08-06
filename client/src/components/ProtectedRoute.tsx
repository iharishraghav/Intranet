import { Navigate } from 'react-router'

import { useSession } from '@/lib/auth-client'
import AppLayout from '@/components/AppLayout'
import { statusMessages } from 'core/messages'

export default function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <p className="px-6 py-8 text-center text-muted-foreground">{statusMessages.loading}</p>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <AppLayout />
}
