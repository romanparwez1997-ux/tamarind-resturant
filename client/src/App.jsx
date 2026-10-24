import { useEffect, useState } from 'react'
import AuthDialog from './components/AuthDialog'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Reserve from './components/Reserve'
import Footer from './components/Footer'
import { getDishes } from './lib/api'
import { authClient } from './lib/authClient'
import { getThali } from './utils'

export default function App() {
  // Lunch or dinner. Several sections need it, so it lives here, at the top.
  // The function form runs once, on first load: before 4 pm -> lunch.
  const [service, setService] = useState(() => (new Date().getHours() < 16 ? 'lunch' : 'dinner'))

  // Plates picked for the thali, e.g. { 6: 2, 11: 1 }.
  // Lives here (not in Menu) because Reserve also shows the pre-order.
  const [quantities, setQuantities] = useState({})

  // The menu, loaded from the API (it used to be imported from data/menu.js).
  // menuStatus lets Menu show "Loading…" or an error instead of an empty grid.
  const [dishes, setDishes] = useState([])
  const [menuStatus, setMenuStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  // useEffect with [] runs once, after the first render: fetch the menu.
  useEffect(() => {
    getDishes()
      .then((data) => {
        setDishes(data)
        setMenuStatus('ready')
      })
      .catch(() => setMenuStatus('error'))
  }, [])

  // Who is signed in. Better Auth asks the server (GET /api/auth/get-session)
  // using the cookie, so this is still filled in after a page refresh.
  // user is null when signed out.
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const user = session?.user ?? null

  // Is the sign-in / sign-up popup open? Header and Reserve can both open it.
  const [authOpen, setAuthOpen] = useState(false)

  function updateQuantity(dishId, newQty) {
    // copy the old object, change one key; never mutate state
    setQuantities((prev) => ({ ...prev, [dishId]: newQty }))
  }

  // Derived: recalculated on every render from the state above
  const thali = getThali(dishes, quantities, service)

  return (
    // data-service switches the colour theme (see index.css)
    <div data-service={service} className="min-h-screen bg-page text-fg transition-colors duration-500">
      <a
        href="#main"
        className="absolute -top-16 left-4 z-[100] rounded-lg bg-ink px-4 py-2.5 text-paper focus:top-4"
      >
        Skip to content
      </a>

      <Header
        service={service}
        onServiceChange={setService}
        user={user}
        sessionLoading={sessionLoading}
        onSignIn={() => setAuthOpen(true)}
      />

      <main id="main">
        <Hero service={service} />
        <About service={service} />
        <Menu
          service={service}
          dishes={dishes}
          menuStatus={menuStatus}
          quantities={quantities}
          onQuantityChange={updateQuantity}
          thali={thali}
          onClearThali={() => setQuantities({})}
        />
        <Reserve service={service} thali={thali} user={user} onSignIn={() => setAuthOpen(true)} />
      </main>

      <Footer />

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
