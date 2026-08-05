import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'

import { signIn, useSession } from '../lib/auth-client'
import './LoginPage.css'

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
    <main className="login">
      <h1>Intranet</h1>
      <p className="login-tagline">
        Internal web application for organization-wide communication.
      </p>

      <button
        type="button"
        className="login-button"
        onClick={() => void handleSignIn()}
        disabled={isPending || signInState.state === 'redirecting'}
      >
        {signInState.state === 'redirecting'
          ? 'Redirecting…'
          : 'Sign in with Zoho'}
      </button>

      {message && (
        <p className="login-error" role="alert">
          {message}
        </p>
      )}
    </main>
  )
}

export default LoginPage
