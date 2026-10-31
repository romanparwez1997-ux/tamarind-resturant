'use client'

import MotionSurface from './components/MotionSurface'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './lib/cartContext'
import AuthDialog from './components/AuthDialog'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import CoastalBackdrop from './components/CoastalBackdrop'
import { useSiteMotion } from './lib/motionContext'
import { usePaymentService } from './hooks/usePaymentService'
import Menu from './components/Menu'
import ReservationTeaser from './components/ReservationTeaser'
import ChefSpecial from './components/ChefSpecial'
import Footer from './components/Footer'
import { getDishes, getOrder, startCheckout } from './lib/api'
import { authClient } from './lib/authClient'
import { getThali } from './utils'

export default function App({ initialService }) {
  const router = useRouter()
  const { paused: motionPaused, toggle: toggleMotion, reduced: motionReduced } = useSiteMotion()
  // Lunch or dinner. Several sections need it, so it lives here, at the top.
  // The server passes the current restaurant service for a consistent first render.
  const [service, setService] = useState(initialService)
  usePaymentService(service)

  // Plates picked for the thali, e.g. { 6: 2, 11: 1 }.
  // The root cart provider keeps this draft through navigation and reloads.
  const { quantities, setQuantities } = useCart()

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

  const checkoutAttempt = useRef(null)
  const checkoutLock = useRef(false)

  // "Change dishes" on checkout restores the owner's pending order from the
  // server. No prices, identity or cart contents are trusted from the URL.
  useEffect(() => {
    if (!user?.id) return
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('restore_order')
    if (!orderId) return
    const controller = new AbortController()
    getOrder(orderId, controller.signal).then((order) => {
      if (controller.signal.aborted || order.status !== 'pending') return
      setQuantities(Object.fromEntries(order.items.map(item => [item.dishId, item.qty])))
      if (['lunch', 'dinner'].includes(params.get('service'))) setService(params.get('service'))
      // The restored cart starts a new attempt if the user chooses checkout again.
      checkoutAttempt.current = null
      window.history.replaceState(window.history.state, '', `${window.location.pathname}#menu-choices`)
    }).catch(() => {})
    return () => controller.abort()
  }, [user?.id, setQuantities])

  // Is the sign-in / sign-up popup open? Header and Reserve can both open it.
  const [authOpen, setAuthOpen] = useState(false)

  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  async function orderThali() {
    if (!user) return setAuthOpen(true)
    if (checkoutLock.current) return
    const items = thali.items.map(({ dish, qty }) => ({ dishId: dish.id, qty }))
    if (!items.length) return
    const fingerprint = JSON.stringify({ userId: user.id, items })
    if (checkoutAttempt.current?.fingerprint !== fingerprint) {
      checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() }
    }
    checkoutLock.current = true
    setCheckoutBusy(true)
    setCheckoutError('')
    try {
      const { orderId } = await startCheckout(items, checkoutAttempt.current.key)
      router.push(`/checkout?${new URLSearchParams({ order_id: orderId, service })}`)
    } catch (error) {
      if (error.status === 409) checkoutAttempt.current = null
      if (error.status === 401) setAuthOpen(true)
      setCheckoutError(error.message)
      checkoutLock.current = false
      setCheckoutBusy(false)
    }
  }

  function updateQuantity(dishId, newQty) {
    // copy the old object, change one key; never mutate state
    setQuantities((prev) => ({ ...prev, [dishId]: newQty }))
  }

  // Derived: recalculated on every render from the state above
  const thali = getThali(dishes, quantities, service)

  return (
    // data-service switches the colour theme (see index.css)
    <MotionSurface data-service={service} className="restaurant-site coastal-site min-h-screen bg-page text-fg transition-colors duration-500">
      <CoastalBackdrop paused={motionPaused} />
      <div className="reading-progress" aria-hidden="true" />
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
      />

      <main id="main">
        <Hero service={service} />
        <About service={service} />
        <ChefSpecial dish={dishes.find(dish => dish.id === 16)} quantity={quantities[16] || 0} onAdd={() => updateQuantity(16, Math.min(9, (quantities[16] || 0) + 1))} />
        <Menu
          service={service}
          dishes={dishes}
          menuStatus={menuStatus}
          quantities={quantities}
          onQuantityChange={updateQuantity}
          thali={thali}
          onClearThali={() => setQuantities({})}
          onOrder={orderThali}
          checkoutBusy={checkoutBusy}
          checkoutError={checkoutError}
          user={user}
          sessionLoading={sessionLoading}
        />
        <ReservationTeaser />
      </main>

      <Footer motionPaused={motionPaused} motionReduced={motionReduced} onToggleMotion={toggleMotion} />

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </MotionSurface>
  )
}
