import { useState } from 'react'
import { courses } from '../data/menu'
import { services } from '../data/site'
import { isServed, rupees } from '../utils'
import DishCard from './DishCard'
import MenuFilters from './MenuFilters'
import Thali from './Thali'
import { Container, Eyebrow, Wave } from './ui'

// `dishes` comes from the API (fetched in App). menuStatus: 'loading' | 'ready' | 'error'
export default function Menu({ service, dishes, menuStatus, quantities, onQuantityChange, thali, onClearThali }) {
  // --- state: only the user's filter choices ---
  const [course, setCourse] = useState('starters')
  const [vegOnly, setVegOnly] = useState(false)
  const [maxSpice, setMaxSpice] = useState(3)

  // --- derived values: worked out from state + props on every render ---

  // Does a dish pass every filter EXCEPT the course tab?
  const matches = (dish) => isServed(dish, service) && (!vegOnly || dish.veg) && dish.spice <= maxSpice

  const visibleDishes = dishes.filter((dish) => dish.course === course && matches(dish))

  // How many dishes each tab would show, e.g. { starters: 3, mains: 2, desserts: 4 }
  const counts = {}
  courses.forEach((c) => {
    counts[c.id] = dishes.filter((dish) => dish.course === c.id && matches(dish)).length
  })

  function resetFilters() {
    setVegOnly(false)
    setMaxSpice(3)
  }

  const courseName = courses.find((c) => c.id === course).label.toLowerCase()

  return (
    <section id="menu" aria-labelledby="menu-title" className="pt-16 md:pt-24">
      <Container>
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>The {services[service].label.toLowerCase()} menu</Eyebrow>
            <h2 id="menu-title" className="max-w-[18ch] font-display text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
              Fill your leaf, one plate at a time
            </h2>
          </div>
          <p className="max-w-[36ch] text-sm text-fg-soft">
            Showing {services[service].label.toLowerCase()} dishes. Switch service at the top of the page to see the
            other menu.
          </p>
        </div>

        <MenuFilters
          course={course}
          onCourseChange={setCourse}
          counts={counts}
          vegOnly={vegOnly}
          onVegOnlyChange={setVegOnly}
          maxSpice={maxSpice}
          onMaxSpiceChange={setMaxSpice}
        />

        {/* Mobile: dishes, then thali underneath. lg: dishes left, thali sticky on the right. */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            <p className="mb-5 text-sm text-fg-soft" aria-live="polite">
              {menuStatus === 'loading' && 'Loading the menu…'}
              {menuStatus === 'error' && (
                <span className="font-bold text-chili">Couldn't load the menu. Please refresh the page.</span>
              )}
              {menuStatus === 'ready' && `${visibleDishes.length} ${vegOnly ? 'vegetarian ' : ''}${courseName}`}
            </p>

            <ul className="grid gap-6 sm:grid-cols-2">
              {visibleDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  quantity={quantities[dish.id] || 0}
                  onQuantityChange={(newQty) => onQuantityChange(dish.id, newQty)}
                />
              ))}
            </ul>

            {menuStatus === 'ready' && visibleDishes.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-line p-6 text-fg-soft">
                <p className="mb-3">No {courseName} match those filters right now.</p>
                <button type="button" onClick={resetFilters} className="cursor-pointer font-bold text-chili underline underline-offset-4">
                  Reset filters
                </button>
              </div>
            )}

            {/* Phones only: a bar that sticks to the bottom of the screen while
                you scroll the dishes, and jumps to the thali. */}
            {thali.plates > 0 && (
              <a
                href="#thali"
                className="sticky bottom-4 z-30 mt-6 flex items-center justify-between rounded-full bg-ink px-5 py-3 text-cream no-underline shadow-xl lg:hidden"
              >
                <span className="font-bold">
                  {thali.plates} on your leaf · {rupees(thali.total)}
                </span>
                <span className="text-sm text-turmeric">View thali ↓</span>
              </a>
            )}
          </div>

          <Thali thali={thali} onClear={onClearThali} />
        </div>
      </Container>

      <Wave className="mt-16 text-ink md:mt-24" />
    </section>
  )
}
