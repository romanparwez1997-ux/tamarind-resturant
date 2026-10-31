import { useState } from 'react'
import Image from 'next/image'
import { dishImage, emptyThaliImage } from '../data/dishImages'
import { courses, cuisines } from '../data/menu'
import { services } from '../data/site'
import { isServed, rupees } from '../utils'
import DishCard from './DishCard'
import MenuFilters from './MenuFilters'
import CourseGallery from './CourseGallery'
import Thali from './Thali'
import { Container, Eyebrow } from './ui'

// `dishes` comes from the API (fetched in App). menuStatus: 'loading' | 'ready' | 'error'
export default function Menu({ service, dishes, menuStatus, quantities, onQuantityChange, thali, onClearThali, onOrder, checkoutBusy, checkoutError, user, sessionLoading }) {
  // --- state: only the user's filter choices ---
  const [course, setCourse] = useState('all')
  const [cuisine, setCuisine] = useState('all')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(8)
  const [vegOnly, setVegOnly] = useState(false)
  const [maxSpice, setMaxSpice] = useState(3)

  // --- derived values: worked out from state + props on every render ---

  // Does a dish pass every filter EXCEPT the course tab?
  const matches = (dish) => isServed(dish, service) && (!vegOnly || dish.veg) && dish.spice <= maxSpice &&
    (cuisine === 'all' || dish.cuisine === cuisine) && (dish.name + ' ' + dish.description).toLowerCase().includes(search.trim().toLowerCase())

  const visibleDishes = dishes.filter((dish) => (course === 'all' || dish.course === course) && matches(dish))

  // How many dishes each tab would show, e.g. { starters: 3, mains: 2, desserts: 4 }
  const counts = {}
  courses.forEach((c) => {
    counts[c.id] = dishes.filter((dish) => (c.id === 'all' || dish.course === c.id) && matches(dish)).length
  })

  function resetFilters() {
    setVegOnly(false)
    setMaxSpice(3)
    setCuisine('all')
    setCourse('all')
    setSearch('')
  }

  const courseName = course === 'all' ? 'dishes' : courses.find((c) => c.id === course).label.toLowerCase()
  function chooseCuisine(value) { setCuisine(value); setCourse('all'); setLimit(8) }

  return (
    <section id="menu" aria-labelledby="menu-title" className="menu-section">
      <div className="coastal-menu-opening"><Container><p className="overline">03 / From the coast to your plate</p><p className="coastal-menu-title">Let the evening<br /><em>unfold.</em></p><div className="coastal-menu-dish"><Image src="/images/hero-dish.png" alt="Prawn sukka, roasted coconut and neer dosa" width={800} height={800} sizes="(max-width: 767px) 90vw, 50vw" /></div><span className="coastal-menu-note">Made for sharing.<br />Chosen by you.</span></Container></div>
      <CourseGallery onChoose={chooseCuisine} />
      <Container>
        <div id="menu-choices" data-reveal className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>The {services[service].label.toLowerCase()} menu</Eyebrow>
            <h2 id="menu-title" className="section-title max-w-[18ch]">
              Follow your appetite.<br />Make it <em>yours.</em>
            </h2>
          </div>
          <p className="max-w-[36ch] text-sm text-fg-soft">
            From Indian comfort to Italian evenings, Chinese favourites and Continental classics. Choose across kitchens and make a meal of it.
          </p>
        </div>

        <div className="cuisine-filters" role="group" aria-label="Choose a cuisine">{cuisines.map(item=><button key={item.id} type="button" aria-pressed={cuisine===item.id} onClick={()=>chooseCuisine(item.id)}>{item.label}<span>{dishes.filter(dish=>isServed(dish,service)&&(item.id==='all'||dish.cuisine===item.id)).length}</span></button>)}</div>
        <label className="menu-search"><span className="overline">Find your favourite</span><input type="search" value={search} onChange={event=>{setSearch(event.target.value);setLimit(8)}} placeholder="Search biryani, pizza, dim sum…" /></label>
        <MenuFilters
          course={course}
          onCourseChange={value=>{setCourse(value);setLimit(8)}}
          counts={counts}
          vegOnly={vegOnly}
          onVegOnlyChange={setVegOnly}
          maxSpice={maxSpice}
          onMaxSpiceChange={setMaxSpice}
        />

        {/* Mobile: dishes, then thali underneath. lg: dishes left, thali sticky on the right. */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <p className="mb-5 text-sm text-fg-soft" aria-live="polite">
              {menuStatus === 'loading' && 'Loading the menu…'}
              {menuStatus === 'error' && (
                <span className="font-bold text-chili">Couldn't load the menu. Please refresh the page.</span>
              )}
              {menuStatus === 'ready' && `${visibleDishes.length} ${vegOnly ? 'vegetarian ' : ''}${courseName}`}
            </p>

            <ul key={`${service}-${course}-${vegOnly}-${maxSpice}`} className="menu-dishes grid gap-5 sm:grid-cols-2">
              {visibleDishes.slice(0,limit).map((dish, index) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  index={index}
                  quantity={quantities[dish.id] || 0}
                  onQuantityChange={(newQty) => onQuantityChange(dish.id, newQty)}
                />
              ))}
            </ul>
            {visibleDishes.length>limit&&<button type="button" className="button-secondary menu-load-more" onClick={()=>setLimit(value=>value+8)}>More to fall in love with <span>+{Math.min(8,visibleDishes.length-limit)}</span></button>}

            {menuStatus === 'ready' && visibleDishes.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-line p-6 text-fg-soft">
                <p className="mb-3">No {courseName} match those filters right now.</p>
                <button type="button" onClick={resetFilters} className="cursor-pointer font-bold text-chili underline underline-offset-4">
                  Reset filters
                </button>
              </div>
            )}


          </div>

          <Thali thali={thali} onClear={onClearThali} onRemove={(id) => onQuantityChange(id, 0)} onOrder={onOrder} busy={checkoutBusy} error={checkoutError} user={user} sessionLoading={sessionLoading} />
        </div>
        {thali.plates > 0 && <a href="#thali" className="mobile-thali-dock" aria-label={`View your thali, ${thali.plates} plates, ${rupees(thali.total)}`}><span className="dock-tray" data-thali-dock><Image src={emptyThaliImage} alt="" width={100} height={100} sizes="76px" />{thali.items.slice(0, 3).map(({ dish }, index) => dishImage(dish.id) && <Image key={dish.id} src={dishImage(dish.id)} alt="" width={60} height={60} sizes="36px" style={{ left: `${18 + index * 14}%`, top: `${24 + index % 2 * 18}%` }} className="dock-dish" />)}</span><span><strong>Your thali is coming together</strong><small>{thali.plates} {thali.plates === 1 ? 'plate' : 'plates'} · {rupees(thali.total)}</small></span><span aria-hidden="true">↗</span></a>}
      </Container>

    </section>
  )
}
