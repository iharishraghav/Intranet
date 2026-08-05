import { Outlet } from 'react-router'

import NavBar from './NavBar'

function AppLayout() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </>
  )
}

export default AppLayout
