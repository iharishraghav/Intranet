import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { signIn, useSession } from '@/lib/auth-client'

type SignInState =
  | { state: 'idle' }
  | { state: 'redirecting' }
  | { state: 'error'; message: string }

const ACCESS_DENIED = 'Access denied. Contact your administrator if you believe this is a mistake.'

function LoginPage() {
  const { data: session, isPending } = useSession()
  const [searchParams] = useSearchParams()
  const [signInState, setSignInState] = useState<SignInState>({ state: 'idle' })

  if (session) return <Navigate to="/" replace />

  const callbackError = searchParams.has('error') ? ACCESS_DENIED : null
  const message =
    signInState.state === 'error' ? signInState.message : callbackError

  async function handleSignIn() {
    setSignInState({ state: 'redirecting' })

    const { error } = await signIn.oauth2({
      providerId: 'zoho',
      callbackURL: '/',
      errorCallbackURL: '/login?error=access_denied',
    })

    if (error) {
      setSignInState({
        state: 'error',
        message: 'Could not reach the sign-in service. Please try again.',
      })
    }
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
            disabled={isPending || signInState.state === 'redirecting'}
          >
            {signInState.state === 'redirecting'
              ? 'Redirecting…'
              : 'Sign in with Zoho'}
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

export default LoginPage
