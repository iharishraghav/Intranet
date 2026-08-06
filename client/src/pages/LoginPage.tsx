import { Navigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { signIn, useSession } from '@/lib/auth-client'
import { useSignInStore } from '@/stores/sign-in-store'
import { errorMessages } from '@core/messages'

export default function LoginPage() {
  const { data: session, isPending } = useSession()
  const [searchParams] = useSearchParams()
  const signInError = useSignInStore((store) => store.error)
  const failWith = useSignInStore((store) => store.failWith)

  if (session) return <Navigate to="/" replace />

  const callbackError = searchParams.has('error') ? errorMessages.accessDenied : null
  const message = signInError ?? callbackError

  async function handleSignIn() {
    const { error } = await signIn.oauth2({
      providerId: 'zoho',
      callbackURL: '/',
      errorCallbackURL: '/login?error=access_denied',
    })

    if (error) failWith(errorMessages.signInUnreachable)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm [--card-spacing:--spacing(6)]">
        <CardHeader className="text-center">
          <h1 className="font-heading text-2xl leading-snug font-semibold tracking-tight">
            Intranet
          </h1>
          <CardDescription>
            Internal web application for organization-wide communication.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => void handleSignIn()}
            disabled={isPending}
          >
            Sign in with Zoho
          </Button>

          {message && (
            <p className="text-center text-sm text-destructive" role="alert">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
