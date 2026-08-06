import { useSession } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <>
      <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
        Welcome, {session?.user.name}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Internal web application for organization-wide communication.
      </p>
    </>
  )
}
