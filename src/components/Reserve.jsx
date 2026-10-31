import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { seatings } from '../data/tables'
import { tableExperiences, experienceForTable } from '../data/tableExperiences'
import { bookingNote } from '../data/bookingNotes'
import { cancelBooking, createBooking, getMyBookings, getTables, getTakenTables } from '../lib/api'
import { prettyDate, restaurantToday } from '../utils'
import PortionStepper from './PortionStepper'
import SeatMap from './SeatMap'
import { Container } from './ui'

function BookingConfirmation({ booking, onAnother }) {
  const title = useRef(null)
  useEffect(()=>{title.current?.focus({preventScroll:true}); title.current?.closest('.booking-welcome').scrollIntoView({behavior:title.current.closest('[data-motion="off"]')?'auto':'smooth',block:'start'})},[])
  const note = bookingNote(booking.name,booking.occasion)
  return <section className="booking-welcome" aria-labelledby="booking-welcome-title"><div className="booking-welcome-picture" data-scroll-image><Image src={booking.experience.image} alt={booking.experience.view} fill sizes="(max-width: 767px) 90vw, 45vw" /><div><span className="overline">Your evening, reserved</span><h2 id="booking-welcome-title" ref={title} tabIndex={-1}>We saved you<br />a <em>little magic.</em></h2></div></div><div className="booking-love-note"><svg viewBox="0 0 60 54" aria-hidden="true"><path d="M30 47C22 40 4 29 4 17 4 3 23 0 30 13 37 0 56 3 56 17 56 29 38 40 30 47Z" fill="none" stroke="currentColor" strokeWidth="1" /></svg><p className="booking-note-greeting">{note.greeting}</p><p className="booking-note-message">{note.message}</p><p>{note.closing}</p><p className="booking-note-signature">{note.signature}</p><dl><div><dt>Your table</dt><dd>{booking.tableId} · {booking.experience.label}</dd></div><div><dt>Your evening</dt><dd>{prettyDate(booking.date)} · {booking.seating}</dd></div><div><dt>Your company</dt><dd>{booking.guests} {booking.guests===1?'guest':'guests'}</dd></div><div><dt>Confirmation</dt><dd>#{booking.id}</dd></div></dl><div className="booking-welcome-actions"><Link href="/#menu-choices" className="button-primary">Dream about dinner ↗</Link><button type="button" onClick={onAnother} className="text-link">Book another table ↗</button></div></div></section>
}

export default function Reserve({ service, user, sessionLoading, onSignIn, initialExperience='all' }) {
  const [guests,setGuests] = useState(2)
  const [seating,setSeating] = useState('')
  const [date,setDate] = useState(restaurantToday)
  const [experience,setExperience] = useState(initialExperience)
  const [tableId,setTableId] = useState(null)
  const [tableResource,setTableResource] = useState(null)
  const [availability,setAvailability] = useState(null)
  const [bookings,setBookings] = useState(null)
  const [revision,setRevision] = useState(0)
  const [busy,setBusy] = useState(false)
  const [cancelling,setCancelling] = useState(null)
  const [error,setError] = useState('')
  const [confirmed,setConfirmed] = useState(null)
  const submitLock = useRef(false)
  const options = seatings[service]
  const activeSeating = options.find(item=>item.time===seating&&!item.full)?.time || options.find(item=>!item.full).time
  const availabilityKey = `${date}:${activeSeating}:${revision}`
  const tables = tableResource?.data || []
  const currentAvailability = availability?.key===availabilityKey ? availability : null
  const ready = Boolean(currentAvailability && !currentAvailability.error && tableResource?.data)
  const taken = currentAvailability?.ids || []
  const picked = tables.find(item=>item.id===tableId)
  const chosen = ready && picked && !taken.includes(picked.id) && picked.seats>=guests ? picked : null
  const selectedExperience = chosen ? experienceForTable(chosen) : tableExperiences.find(item=>item.id===experience) || tableExperiences[0]
  const visibleTables = tables.filter(table=>experience==='all'||experienceForTable(table).id===experience)

  useEffect(()=>{
    const controller=new AbortController()
    getTables(controller.signal).then(data=>setTableResource({data})).catch(error=>{if(!controller.signal.aborted)setTableResource({error:error.message})})
    return ()=>controller.abort()
  },[])
  useEffect(()=>{
    const controller=new AbortController()
    if(date) getTakenTables(date,activeSeating,controller.signal).then(ids=>{if(!controller.signal.aborted)setAvailability({key:availabilityKey,ids})}).catch(error=>{if(!controller.signal.aborted)setAvailability({key:availabilityKey,error:error.message})})
    return ()=>controller.abort()
  },[date,activeSeating,availabilityKey])
  const userId=user?.id
  useEffect(()=>{
    if(!userId)return
    const controller=new AbortController()
    getMyBookings(controller.signal).then(data=>{if(!controller.signal.aborted)setBookings({userId,data})}).catch(()=>{if(!controller.signal.aborted)setBookings({userId,error:true})})
    return ()=>controller.abort()
  },[userId,revision])
  function chooseExperience(value){setExperience(value);setTableId(null)}
  function chooseTable(id){setTableId(id);const table=tables.find(item=>item.id===id);if(table)setExperience(experienceForTable(table).id)}
  async function submit(event){
    event.preventDefault()
    if(!user)return onSignIn()
    if(submitLock.current||!chosen)return
    const form=new FormData(event.currentTarget)
    const name=String(form.get('name')).trim()
    if(!name)return setError('Please tell us your name.')
    submitLock.current=true;setBusy(true);setError('')
    try{
      const booking=await createBooking({tableId:chosen.id,date,seating:activeSeating,guests,name,phone:String(form.get('phone')).trim(),occasion:form.get('occasion'),notes:form.get('notes'),items:[]})
      setConfirmed({...booking,name,occasion:form.get('occasion'),experience:experienceForTable(chosen)})
      setRevision(value=>value+1)
    }catch(error){setError(error.message);setRevision(value=>value+1)}
    finally{submitLock.current=false;setBusy(false)}
  }
  async function cancel(id){
    if(!window.confirm('Cancel this reservation?'))return
    setCancelling(id);setError('')
    try{await cancelBooking(id);setRevision(value=>value+1)}
    catch(error){setError(error.message)}
    finally{setCancelling(null)}
  }

  return <section id="reserve" className="table-reservations"><Container>
    {confirmed?<BookingConfirmation booking={confirmed} onAnother={()=>{setConfirmed(null);setTableId(null)}} />:<>
    <div className="experience-selector" role="group" aria-label="Choose a table experience">{tableExperiences.map((item,index)=><button key={item.id} type="button" disabled={busy} aria-pressed={experience===item.id} onClick={()=>chooseExperience(item.id)} className="experience-card"><div className="experience-card-media" data-scroll-image><Image src={item.image} alt={item.view} width={800} height={540} sizes="(max-width: 767px) 85vw, 30vw" /><span>{item.id==='ocean'?'Best view':`0${index+1}`}</span><i aria-hidden="true">{experience===item.id?'✓':'↗'}</i></div><div className="experience-card-copy"><p className="overline">{item.eyebrow}</p><h2>{item.label}</h2><p>{item.description}</p></div></button>)}</div>
    <form method="post" onSubmit={submit} className="table-booking-form">
      <div className="booking-selection">
        <div className="booking-section-heading"><span>01</span><div><p className="overline">Let’s make a little room</p><h2>Choose your <em>moment.</em></h2></div></div>
        <fieldset className="booking-moment" disabled={busy}><legend className="sr-only">Date, guests and seating</legend><label htmlFor="reservation-date">Date<input id="reservation-date" name="date" type="date" min={restaurantToday()} required value={date} onChange={event=>setDate(event.target.value)} /></label><div><span>Guests</span><PortionStepper value={guests} onChange={setGuests} min={1} max={6} label="Guests" /></div><fieldset className="booking-seatings"><legend>Seating · {service}</legend><div>{options.map(option=><button key={option.time} type="button" disabled={option.full||busy} aria-pressed={activeSeating===option.time} onClick={()=>setSeating(option.time)}>{option.time}{option.full?' · full':''}</button>)}</div></fieldset></fieldset>
        <div className="booking-section-heading"><span>02</span><div><p className="overline">The setting matters</p><h2>A table that feels <em>right.</em></h2></div></div>
        <div className="table-list-heading"><span>{experience==='all'?'All settings':selectedExperience.label}</span><button type="button" disabled={busy} onClick={()=>chooseExperience('all')}>Show all tables</button></div>
        {tableResource?.error?<p role="alert" className="account-notice is-error">{tableResource.error} Please refresh to try again.</p>:currentAvailability?.error?<div className="account-notice is-error"><p role="alert">We couldn’t check availability. Please retry before choosing a table.</p><button type="button" className="text-link" onClick={()=>setRevision(value=>value+1)}>Check again ↗</button></div>:!ready?<p role="status" className="availability-status">Checking the room for you…</p>:<div className="table-options" role="group" aria-label="Choose your table">{visibleTables.map(table=>{
          const booked=taken.includes(table.id), small=table.seats<guests
          return <button key={table.id} type="button" disabled={booked||small||busy} aria-pressed={chosen?.id===table.id} onClick={()=>chooseTable(table.id)} aria-label={`Table ${table.id}, ${table.seats} seats, ${experienceForTable(table).label}, ${booked?'reserved':small?'too small':'available'}`}><strong>{table.id}</strong><span>{table.seats} seats</span><small>{booked?'Reserved':small?'Too small':experienceForTable(table).label}</small><i aria-hidden="true">{chosen?.id===table.id?'✓':'↗'}</i></button>
        })}</div>}
        <details className="booking-floor-plan"><summary>Explore the floor plan <span aria-hidden="true">+</span></summary>{ready?<SeatMap tables={tables} guests={guests} booked={taken} selectedId={chosen?.id} onSelect={chooseTable} />:<p className="account-help">The floor plan will be available once we’ve checked your date and seating.</p>}</details>
        <div className="table-preview"><div className="table-preview-media">{tableExperiences.map(item=><Image key={item.id} src={item.image} alt={item.id===selectedExperience.id?item.view:''} fill sizes="(max-width: 767px) 90vw, 650px" loading="eager" className={item.id===selectedExperience.id?'is-active':''} />)}<span>{chosen?`Your setting · ${chosen.id}`:'A glimpse of your setting'}</span></div><div><p className="overline">{selectedExperience.view}</p><h3>{selectedExperience.label}</h3><p>{selectedExperience.bestFor}. Setting preview; individual table positions are shown on the floor plan.</p></div></div>
      </div>
      <aside className="booking-details"><div className="booking-section-heading"><span>03</span><div><p className="overline">A warm welcome starts here</p><h2>Make it <em>yours.</em></h2></div></div><fieldset disabled={busy} className="account-form"><legend className="sr-only">Your booking details</legend><label htmlFor="booking-name">Your name<input key={userId||'guest'} id="booking-name" name="name" autoComplete="name" defaultValue={user?.name||''} maxLength={100} required /></label><label htmlFor="booking-phone">Contact number<input id="booking-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={20} required /></label><label htmlFor="booking-occasion">What brings you in?<select id="booking-occasion" name="occasion"><option value="">Just a lovely meal</option><option>Birthday</option><option>Anniversary</option><option>Business</option><option>First visit</option></select></label><label htmlFor="booking-notes">A little something we should know<textarea id="booking-notes" name="notes" rows={3} maxLength={1000} placeholder="Allergies, a celebration, a favourite corner…" /></label></fieldset><dl className="booking-summary"><div><dt>Setting</dt><dd>{chosen?`${chosen.id} · ${selectedExperience.label}`:'Choose a table'}</dd></div><div><dt>Company</dt><dd>{guests} {guests===1?'guest':'guests'}</dd></div><div><dt>When</dt><dd>{date?prettyDate(date):'Choose a date'} · {activeSeating}</dd></div><div><dt>Reservation</dt><dd>Complimentary</dd></div></dl>{error&&<p role="alert" className="account-notice is-error">{error}</p>}<button type={user?'submit':'button'} onClick={user?undefined:onSignIn} disabled={busy||sessionLoading||(user&&!chosen)} className="button-primary">{busy?'Saving your evening…':sessionLoading?'Checking sign-in…':!user?'Sign in to reserve':!chosen?'Choose your table first':'Save our table'} <span aria-hidden="true">↗</span></button><p className="booking-small-print">We’ll reserve your chosen table after confirmation. Food orders and payments are separate. Your contact details stay private.</p><p className="booking-signature">We can’t wait to welcome you.</p></aside>
    </form></>}
    {user&&bookings?.userId===userId&&bookings.data?.length>0&&<section className="your-reservations" aria-labelledby="your-reservations-title"><p className="eyebrow">Something to look forward to</p><h2 id="your-reservations-title">Your upcoming <em>evenings.</em></h2><div>{bookings.data.map(booking=><article key={booking.id}><div><span className="overline">Table {booking.tableId} · {booking.guests} guests</span><h3>{prettyDate(booking.date)}</h3><p>{booking.seating}</p></div><button type="button" className="text-link" disabled={cancelling===booking.id} onClick={()=>cancel(booking.id)}>{cancelling===booking.id?'Cancelling…':'Cancel reservation'} ↗</button></article>)}</div></section>}
    {user&&bookings?.userId===userId&&bookings.error&&<p role="alert" className="account-notice">We couldn’t load your upcoming reservations. <button type="button" onClick={()=>setRevision(value=>value+1)}>Try again.</button></p>}
  </Container></section>
}
