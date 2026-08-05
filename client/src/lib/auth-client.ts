import { genericOAuthClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [
    genericOAuthClient(),
    inferAdditionalFields({ user: { role: { type: 'string' } } }),
  ],
})

export const { useSession, signIn, signOut } = authClient
