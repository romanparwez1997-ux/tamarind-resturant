import { useState } from 'react'
import { btn, btnSmall, fieldLabel } from '../classes'
import { perks, services } from '../data/site'
import { bookedTables, seatings, tables } from '../data/tables'
import { rupees } from '../utils'
import PortionStepper from './PortionStepper'
import SeatMap from './SeatMap'
import { Container, Eyebrow, Wave } from './ui'

const input =
  'w-full min-w-0 rounded-xl border-[1.5px] border-ink/15 bg-white px-3.5 py-3 text-ink focus:border-sea focus:outline-3 focus:outline-turmeric/60'

export default function Reserve({ service, thali }) {
  // --- state: the user's choices ---
  const [guests, setGuests] = useState(2)
  const [seating, setSeating] = useState('')
  const [tableId, setTableId] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  // --- derived values ---
  // Seatings for the current service. If the stored seating isn't one of them
  // (e.g. you switched lunch -> dinner), fall back to the first free one.
  const options = seatings[service]
  const activeSeating = options.find((s) => s.time === seating && !s.full)?.time ?? options.find((s) => !s.full).time
  const booked = bookedTables[activeSeating] || []

  // The chosen table only counts if it's still free and big enough.
  // Changing guests or seating can invalidate it, with no extra code.
  const picked = tables.find((t) => t.id === tableId)
  const chosenTable = picked && !booked.includes(picked.id) && picked.seats >= guests ? picked : null

  function handleSubmit(event) {
    event.preventDefault() // don't reload the page; no backend until Week 3
    if (!chosenTable) return
    setSubmitted(true)
  }

  function startOver() {
    setSubmitted(false)
    setTableId(null)
  }

  const chip = (active, disabled) =>
    `min-w-11 rounded-full border-[1.5px] px-4 py-2 text-center text-sm font-bold transition ${
      active ? 'border-turmeric bg-turmeric text-ink' : 'border-cream/30 hover:border-cream'
    } ${disabled ? 'cursor-not-allowed line-through opacity-40 hover:border-cream/30' : 'cursor-pointer'}`

  return (
    <section
      id="reserve"
      aria-labelledby="reserve-title"
      className="bg-ink bg-[radial-gradient(circle_at_0_0,rgb(233_162_59/0.16),transparent_35%)] pt-12 text-cream md:pt-16"
    >
      <Container>
        <div className="max-w-2xl">
          <Eyebrow className="text-turmeric">Reservations · {services[service].label}</Eyebrow>
          <h2 id="reserve-title" className="mb-4 font-display text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
            Pick your own table
          </h2>
          <p className="text-cream/80">{services[service].reserveNote}</p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2 before:font-bold before:text-turmeric before:content-['✓']">
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* One form. Left: party, seating, floor plan. Right: the ticket. */}
        <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="grid gap-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-10">
              <div className="grid justify-items-start gap-2">
                <span className={fieldLabel}>Guests</span>
                {/* Same controlled stepper as the dish cards, reused */}
                <PortionStepper value={guests} onChange={setGuests} min={1} max={6} label="Guests" />
                <span className="text-xs text-cream/60">7 or more? Call us.</span>
              </div>

              <fieldset className="grid min-w-0 gap-2">
                <legend className={`${fieldLabel} mb-2`}>Seating</legend>
                <div className="flex flex-wrap gap-2">
                  {options.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={s.full}
                      aria-pressed={activeSeating === s.time}
                      onClick={() => setSeating(s.time)}
                      className={chip(activeSeating === s.time, s.full)}
                    >
                      {s.time}
                      {s.full && ' · full'}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <SeatMap tables={tables} guests={guests} booked={booked} selectedId={chosenTable?.id} onSelect={setTableId} />
          </div>

          {/* The ticket */}
          <div className="relative overflow-hidden rounded-[20px] bg-paper text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
            <div className="grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="name" className={`${fieldLabel} text-ink-soft`}>Name</label>
                  <input id="name" name="name" autoComplete="name" required className={input} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="phone" className={`${fieldLabel} text-ink-soft`}>WhatsApp number</label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={input} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="date" className={`${fieldLabel} text-ink-soft`}>Date</label>
                  <input id="date" name="date" type="date" required className={input} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="occasion" className={`${fieldLabel} text-ink-soft`}>Occasion</label>
                  <select id="occasion" name="occasion" className={input}>
                    <option value="">Just a meal</option>
                    <option>Birthday</option>
                    <option>Anniversary</option>
                    <option>Business</option>
                    <option>First visit</option>
                  </select>
                </div>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="notes" className={`${fieldLabel} text-ink-soft`}>Allergies or requests</label>
                <textarea id="notes" name="notes" rows="2" className={`${input} resize-y`} />
              </div>
            </div>

            {/* Tear-off stub. ::before / ::after are the half-moon notches. */}
            <div className="relative grid gap-4 border-t-2 border-dashed border-ink/20 bg-[#fbe9c9] p-6 before:absolute before:-top-[13px] before:-left-[13px] before:size-[26px] before:rounded-full before:bg-ink after:absolute after:-top-[13px] after:-right-[13px] after:size-[26px] after:rounded-full after:bg-ink">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="font-bold text-ink-soft">Admit</dt>
                <dd>{guests} · {activeSeating}</dd>
                <dt className="font-bold text-ink-soft">Table</dt>
                <dd className={chosenTable ? 'font-bold' : 'text-chili'}>
                  {chosenTable ? `${chosenTable.id} · ${chosenTable.zone}, ${chosenTable.seats} seats` : 'Tap a table on the map'}
                </dd>
                <dt className="font-bold text-ink-soft">Thali</dt>
                <dd>
                  {thali.plates > 0 ? `${thali.plates} plates pre-ordered · ${rupees(thali.total)}` : 'None yet (optional)'}
                </dd>
              </dl>
              <button type="submit" disabled={!chosenTable} className={`${btn} w-full`}>
                {chosenTable ? 'Request table' : 'Pick a table first'}
              </button>
            </div>

            {submitted && chosenTable && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/97 p-8 text-center motion-safe:animate-rise">
                <p className="mb-2 -rotate-8 rounded-[10px] border-4 border-double border-chili px-5 py-1.5 font-display text-3xl font-extrabold tracking-widest text-chili uppercase">
                  Received
                </p>
                <p>
                  Table {chosenTable.id} for {guests} at {activeSeating}.
                  {thali.plates > 0 && ` Your ${thali.plates}-plate thali will be ready.`} We'll confirm on WhatsApp
                  within the hour.
                </p>
                <button type="button" onClick={startOver} className={`${btn} ${btnSmall}`}>
                  Book another table
                </button>
              </div>
            )}
          </div>
        </form>
      </Container>

      <Wave className="mt-16 text-ink-deep md:mt-24" />
    </section>
  )
}
