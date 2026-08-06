import { Navigate, Outlet } from 'react-router'

import { useSession } from '@/lib/auth-client'
import { roles } from 'core/constants'
import { statusMessages } from 'core/messages'

export default function AdminRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <p className="px-6 py-8 text-center text-muted-foreground">{statusMessages.loading}</p>
    )
  }

  if (session?.user.role !== roles.admin) return <Navigate to="/" replace />

  return <Outlet />
}
