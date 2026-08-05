import { Outlet } from 'react-router'

import NavBar from './NavBar'
import './AppLayout.css'

function AppLayout() {
  return (
    <>
      <NavBar />
      <main className="app">
        <Outlet />
      </main>
    </>
  )
}

export default AppLayout
