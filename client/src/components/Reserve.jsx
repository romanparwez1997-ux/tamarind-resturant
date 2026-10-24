import { useEffect, useState } from 'react'
import { btn, btnSmall, fieldLabel, textInput } from '../classes'
import { perks, services } from '../data/site'
import { seatings } from '../data/tables'
import { cancelBooking, createBooking, getMyBookings, getTables, getTakenTables } from '../lib/api'
import { prettyDate, restaurantToday, rupees } from '../utils'
import PortionStepper from './PortionStepper'
import SeatMap from './SeatMap'
import { Container, Eyebrow, Wave } from './ui'

export default function Reserve({ service, thali, user, onSignIn }) {
  // --- state: the user's choices ---
  const [guests, setGuests] = useState(2)
  const [seating, setSeating] = useState('')
  const [date, setDate] = useState(restaurantToday)
  const [tableId, setTableId] = useState(null)

  // --- state: data from the API ---
  const [tables, setTables] = useState([]) // the 9 dining tables
  const [taken, setTaken] = useState([]) // table ids booked for this date + seating
  const [myBookings, setMyBookings] = useState([]) // the signed-in user's upcoming bookings

  // --- state: the request ---
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null) // the booking the server sent back

  // --- derived values ---
  // Seatings for the current service. If the stored seating isn't one of them
  // (e.g. you switched lunch -> dinner), fall back to the first free one.
  const options = seatings[service]
  const activeSeating = options.find((s) => s.time === seating && !s.full)?.time ?? options.find((s) => !s.full).time

  // The chosen table only counts if it's still free and big enough.
  // Changing guests, date or seating can invalidate it, with no extra code.
  const picked = tables.find((t) => t.id === tableId)
  const chosenTable = picked && !taken.includes(picked.id) && picked.seats >= guests ? picked : null

  // --- loading data ---

  // The floor plan: load once.
  useEffect(() => {
    getTables().then(setTables).catch(() => setError("Couldn't load the floor plan. Please refresh."))
  }, [])

  // Taken tables: load again every time the date or seating changes.
  // `ignore` stops an old, slow answer overwriting a newer one if you click
  // through seatings quickly (the cleanup runs before the next fetch).
  function loadTaken() {
    let ignore = false
    getTakenTables(date, activeSeating)
      .then((ids) => !ignore && setTaken(ids))
      .catch(() => !ignore && setTaken([]))
    return () => {
      ignore = true
    }
  }
  useEffect(loadTaken, [date, activeSeating])

  // My bookings: load when someone signs in (userId changes).
  const userId = user?.id
  function loadMyBookings() {
    if (userId) getMyBookings().then(setMyBookings).catch(() => setMyBookings([]))
  }
  useEffect(loadMyBookings, [userId])

  // --- actions ---

  async function handleSubmit(event) {
    event.preventDefault() // don't reload the page; we send the data with fetch instead
    if (!user) return onSignIn()
    if (!chosenTable) return

    // Name, phone, occasion and notes aren't in state: nothing needs them
    // until now, so we read them straight from the form.
    const form = new FormData(event.target)

    setBusy(true)
    setError('')
    try {
      const booking = await createBooking({
        tableId: chosenTable.id,
        date,
        seating: activeSeating,
        guests,
        name: form.get('name'),
        phone: form.get('phone'),
        occasion: form.get('occasion'),
        notes: form.get('notes'),
        items: thali.items.map(({ dish, qty }) => ({ dishId: dish.id, qty })),
      })
      setConfirmed(booking)
      loadMyBookings()
    } catch (err) {
      // e.g. 409 "someone just booked that table": show it and refresh the map
      setError(err.message)
    } finally {
      setBusy(false)
      loadTaken()
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await cancelBooking(id)
      // If the ticket is still showing this booking's "Booked" stamp, clear it
      if (confirmed?.id === id) startOver()
    } catch (err) {
      window.alert(err.message)
    }
    loadMyBookings()
    loadTaken()
  }

  function startOver() {
    setConfirmed(null)
    setTableId(null)
  }

  const chip = (active, disabled) =>
    `min-w-11 rounded-full border-[1.5px] px-4 py-2 text-center text-sm font-bold transition ${
      active ? 'border-turmeric bg-turmeric text-ink' : 'border-cream/30 hover:border-cream'
    } ${disabled ? 'cursor-not-allowed line-through opacity-40 hover:border-cream/30' : 'cursor-pointer'}`

  let submitLabel = 'Request table'
  if (!user) submitLabel = 'Sign in to book'
  else if (!chosenTable) submitLabel = 'Pick a table first'
  else if (busy) submitLabel = 'Sending…'

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

        {/* One form. Left: date, party, seating, floor plan. Right: the ticket. */}
        <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="grid gap-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-10">
              <div className="grid justify-items-start gap-2">
                <label htmlFor="date" className={fieldLabel}>Date</label>
                {/* Controlled now: changing it reloads which tables are taken */}
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  min={restaurantToday()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${textInput} w-auto`}
                />
              </div>

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

            <SeatMap tables={tables} guests={guests} booked={taken} selectedId={chosenTable?.id} onSelect={setTableId} />
          </div>

          {/* The ticket */}
          <div className="relative overflow-hidden rounded-[20px] bg-paper text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
            <div className="grid gap-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="name" className={`${fieldLabel} text-ink-soft`}>Name</label>
                  {/* key: when someone signs in, re-create the input so it picks up their name */}
                  <input key={user?.id} id="name" name="name" autoComplete="name" defaultValue={user?.name} required className={textInput} />
                </div>
                <div className="grid min-w-0 gap-1.5">
                  <label htmlFor="phone" className={`${fieldLabel} text-ink-soft`}>WhatsApp number</label>
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={textInput} />
                </div>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="occasion" className={`${fieldLabel} text-ink-soft`}>Occasion</label>
                <select id="occasion" name="occasion" className={textInput}>
                  <option value="">Just a meal</option>
                  <option>Birthday</option>
                  <option>Anniversary</option>
                  <option>Business</option>
                  <option>First visit</option>
                </select>
              </div>
              <div className="grid min-w-0 gap-1.5">
                <label htmlFor="notes" className={`${fieldLabel} text-ink-soft`}>Allergies or requests</label>
                <textarea id="notes" name="notes" rows="2" className={`${textInput} resize-y`} />
              </div>
            </div>

            {/* Tear-off stub. ::before / ::after are the half-moon notches. */}
            <div className="relative grid gap-4 border-t-2 border-dashed border-ink/20 bg-[#fbe9c9] p-6 before:absolute before:-top-[13px] before:-left-[13px] before:size-[26px] before:rounded-full before:bg-ink after:absolute after:-top-[13px] after:-right-[13px] after:size-[26px] after:rounded-full after:bg-ink">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="font-bold text-ink-soft">Admit</dt>
                <dd>{guests} · {prettyDate(date)} · {activeSeating}</dd>
                <dt className="font-bold text-ink-soft">Table</dt>
                <dd className={chosenTable ? 'font-bold' : 'text-chili'}>
                  {chosenTable ? `${chosenTable.id} · ${chosenTable.zone}, ${chosenTable.seats} seats` : 'Tap a table on the map'}
                </dd>
                <dt className="font-bold text-ink-soft">Thali</dt>
                <dd>
                  {thali.plates > 0 ? `${thali.plates} plates pre-ordered · ${rupees(thali.total)}` : 'None yet (optional)'}
                </dd>
              </dl>

              {error && (
                <p role="alert" className="rounded-xl bg-chili/10 px-3.5 py-2.5 text-sm font-bold text-chili">
                  {error}
                </p>
              )}

              {/* Signed out: the button opens the sign-in popup instead of submitting */}
              <button
                type={user ? 'submit' : 'button'}
                onClick={user ? undefined : onSignIn}
                disabled={user && (!chosenTable || busy)}
                className={`${btn} w-full`}
              >
                {submitLabel}
              </button>
            </div>

            {confirmed && (
              <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/97 p-8 text-center motion-safe:animate-rise">
                <p className="mb-2 -rotate-8 rounded-[10px] border-4 border-double border-chili px-5 py-1.5 font-display text-3xl font-extrabold tracking-widest text-chili uppercase">
                  Booked
                </p>
                <p>
                  Table {confirmed.tableId} for {confirmed.guests} on {prettyDate(confirmed.date)} at {confirmed.seating}.
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

        {/* Only for signed-in users who have something booked */}
        {user && myBookings.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 font-display text-2xl font-bold text-turmeric">Your upcoming bookings</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myBookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-cream/20 p-4">
                  <div className="text-sm">
                    <p className="font-bold">
                      {prettyDate(b.date)} · {b.seating}
                    </p>
                    <p className="text-cream/70">
                      Table {b.tableId} · {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                      {b.plates > 0 && ` · thali ${rupees(b.total)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancel(b.id)}
                    className="cursor-pointer rounded-full border-2 border-cream/40 px-4 py-2 text-sm font-bold transition hover:border-cream hover:bg-cream hover:text-ink"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>

      <Wave className="mt-16 text-ink-deep md:mt-24" />
    </section>
  )
}
