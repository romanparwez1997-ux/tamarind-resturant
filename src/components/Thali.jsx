import Link from 'next/link'
import Image from 'next/image'
import { useLayoutEffect, useRef } from 'react'
import { btn, btnGhost, btnSmall } from '../classes'
import { rupees } from '../utils'
import { dishImage, emptyThaliImage } from '../data/dishImages'
import { thaliPlacement } from '../lib/thaliLayout'

export default function Thali({ thali, onClear, onOrder, onRemove, busy, error, user, sessionLoading }) {
  const { items, plates, total } = thali
  const stageRef = useRef(null)
  const previous = useRef(new Map())
  useLayoutEffect(() => {
    const stage = stageRef.current
    const next = new Map()
    for (const piece of stage.querySelectorAll('[data-thali-piece]')) {
      const id = piece.dataset.thaliPiece
      const current = { x: piece.offsetLeft, y: piece.offsetTop }
      const old = previous.current.get(id)
      if (old && stage.closest('[data-motion]')?.dataset.motion === 'ready') {
        const x = old.x - current.x
        const y = old.y - current.y
        if (Math.abs(x) + Math.abs(y) > 1) piece.animate([{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' })
      }
      next.set(id, current)
    }
    previous.current = next
  }, [items])

  return (
    <aside id="thali" aria-labelledby="thali-title" className="thali-card lg:sticky lg:top-28">
      <div className="thali-heading"><div><span>Your composition</span><h3 id="thali-title">Your thali</h3></div><span className="thali-plate-count" aria-live="polite">{plates} {plates === 1 ? 'plate' : 'plates'}</span></div>
      <div ref={stageRef} className={`live-thali ${plates ? 'is-filled' : 'is-empty'}`} data-thali-stage role="group" aria-label="Your selected dishes on a banana leaf">
        <Image src={emptyThaliImage} alt="" width={600} height={600} sizes="(max-width: 767px) 90vw, 360px" className="live-thali-base" />
        {items.map(({ dish, qty }, index) => {
          const { x, y, size } = thaliPlacement(index, items.length)
          const photo = dishImage(dish.id)
          return <div key={dish.id} data-thali-piece={dish.id} className="thali-piece" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }} title={`${dish.name} ×${qty}`}><div className="thali-piece-food">{photo ? <Image src={photo} alt={dish.name} width={240} height={240} sizes="130px" /> : <span className="thali-piece-label">{dish.name}</span>}<span key={qty} className="thali-qty" aria-label={`${qty} ${qty === 1 ? 'plate' : 'plates'}`}>×{qty}</span></div></div>
        })}
        {!plates && <div className="thali-empty-message"><span aria-hidden="true">✳</span><p>A little room<br />for something lovely.</p><small>Choose a dish to begin</small></div>}
      </div>
      {items.length > 0 && <ul className="thali-receipt">{items.map(({ dish, qty }) => <li key={dish.id}><div className="receipt-photo">{dishImage(dish.id) && <Image src={dishImage(dish.id)} alt="" width={72} height={72} sizes="36px" />}</div><span className="receipt-name">{dish.name}<small>×{qty} · {rupees(dish.price)} each</small></span><strong>{rupees(dish.price * qty)}</strong><button type="button" className="receipt-remove" aria-label={`Remove ${dish.name} from thali`} onClick={() => onRemove(dish.id)}>×</button></li>)}</ul>}
      <div className="thali-total"><span>Your total</span><strong aria-live="polite">{rupees(total)}</strong></div>
      <p className="thali-note">Taxes included. Table reservations are booked separately.</p>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-chili">{error}</p>}
      {plates > 0 && <div className="thali-actions"><button type="button" onClick={onOrder} disabled={busy || sessionLoading} className={`${btn} w-full`}>{busy ? 'Preparing your order…' : sessionLoading ? 'Checking sign-in…' : user ? 'Order this thali' : 'Sign in to order'}<span aria-hidden="true">↗</span></button><p className="thali-note">Test payments only · no real money charged</p><div className="flex justify-between gap-3"><button type="button" onClick={onClear} className={`${btnGhost} ${btnSmall}`}>Clear leaf</button><Link href="/reservations" className="text-link">Book a table ↗</Link></div></div>}
    </aside>
  )
}
