export const apiMessages = {
  accessDenied: 'Access denied.',
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
} as const

export const errorMessages = {
  accessDenied: 'Access denied. Contact your administrator if you believe this is a mistake.',
  signInUnreachable: 'Could not reach the sign-in service. Please try again.',
  apiDisconnected: (reason: string) =>
    `Not connected — ${reason}. Is the server running on port 3000?`,
} as const

export const statusMessages = {
  loading: 'Loading…',
  apiChecking: 'Checking…',
  apiConnected: (status: string) => `Connected — server status: ${status}`,
} as const

export const serverMessages = {
  listening: (port: number) => `[server] listening on http://localhost:${port}`,
  invalidEnv: (details: string) => `Invalid environment variables:\n${details}`,
} as const

export const seedMessages = {
  invalidEnv: (details: string) => `Invalid seed environment variables:\n${details}`,
  emailOutsideAllowedDomain: 'is outside ALLOWED_EMAIL_DOMAIN',
  adminExists: (email: string) => `Admin user ${email} already exists — skipping.`,
  adminCreated: (email: string) => `Admin user ${email} created successfully.`,
  adminFailed: 'Error seeding admin user:',
} as const
