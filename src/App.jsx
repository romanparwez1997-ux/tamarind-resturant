import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
import Reserve from './components/Reserve'
import Footer from './components/Footer'
import { getThali } from './utils'

export default function App() {
  // Lunch or dinner. Several sections need it, so it lives here, at the top.
  // The function form runs once, on first load: before 4 pm -> lunch.
  const [service, setService] = useState(() => (new Date().getHours() < 16 ? 'lunch' : 'dinner'))

  // Plates picked for the thali, e.g. { 6: 2, 11: 1 }.
  // Lives here (not in Menu) because Reserve also shows the pre-order.
  const [quantities, setQuantities] = useState({})

  function updateQuantity(dishId, newQty) {
    // copy the old object, change one key; never mutate state
    setQuantities((prev) => ({ ...prev, [dishId]: newQty }))
  }

  // Derived: recalculated on every render from the two states above
  const thali = getThali(quantities, service)

  return (
    // data-service switches the colour theme (see index.css)
    <div data-service={service} className="min-h-screen bg-page text-fg transition-colors duration-500">
      <a
        href="#main"
        className="absolute -top-16 left-4 z-[100] rounded-lg bg-ink px-4 py-2.5 text-paper focus:top-4"
      >
        Skip to content
      </a>

      <Header service={service} onServiceChange={setService} />

      <main id="main">
        <Hero service={service} />
        <About service={service} />
        <Menu
          service={service}
          quantities={quantities}
          onQuantityChange={updateQuantity}
          thali={thali}
          onClearThali={() => setQuantities({})}
        />
        <Reserve service={service} thali={thali} />
      </main>

      <Footer />
    </div>
  )
}
