import { Navigate } from 'react-router'

import { useSession } from '../lib/auth-client'
import AppLayout from './AppLayout'

function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) return <p className="route-pending">Loading&hellip;</p>

  if (!session) return <Navigate to="/login" replace />

  return <AppLayout />
}

export default ProtectedRoute
