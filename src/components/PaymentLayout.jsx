import MotionSurface from './MotionSurface'
import Link from 'next/link'
import Image from 'next/image'
import { dishImage, emptyThaliImage } from '../data/dishImages'
import { thaliPlacement } from '../lib/thaliLayout'
import { rupees } from '../utils'

export function PaymentLayout({ service, step = 2, backHref = '/#menu-choices', children }) {
  return <MotionSurface data-service={service} className="restaurant-site payment-site bg-page text-fg">
    <header className="payment-header"><Link href="/" className="payment-brand"><span aria-hidden="true">✳</span><span>Tamarind <i>&amp;</i> Tide<small>Coastal kitchen · Konark, Odisha</small></span></Link><Link href={backHref} className="payment-back">Back to menu <span aria-hidden="true">↗</span></Link></header>
    <main id="main" className="payment-main"><ol className="payment-steps" aria-label="Checkout progress">{['Your thali', 'Payment', 'Confirmation'].map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} data-complete={index + 1 < step}><span>{index + 1 < step ? '✓' : `0${index + 1}`}</span>{label}{index < 2 && <i aria-hidden="true" />}</li>)}</ol>{children}</main>
    <footer className="payment-footer"><span>From our kitchen, with care.</span><p>Stripe test mode · No real money is charged</p><span>Konark, Odisha, India</span></footer>
  </MotionSurface>
}

export function PaymentScene({ items = [], title, description, eyebrow = 'A meal worth making time for', confirmed = false }) {
  return <section className="payment-intro" aria-labelledby="payment-title"><p className="eyebrow">{eyebrow}</p><h1 id="payment-title" className="payment-title">{title}</h1><p className="payment-description">{description}</p><div className={`payment-scene ${confirmed ? 'is-confirmed' : ''}`} role="img" aria-label={items.length ? `Your thali with ${items.map(item => item.name).join(', ')}` : 'A coastal thali on a banana leaf'}>
    <span className="payment-scene-orbit" aria-hidden="true" />
    <Image src={items.length ? emptyThaliImage : '/images/coastal-thali.png'} alt="" width={650} height={650} sizes="(max-width: 767px) 150px, 440px" priority className="payment-tray" />
    {items.map((item, index) => { const photo = dishImage(item.dishId); const point = thaliPlacement(index, items.length); return photo && <Image key={item.dishId} src={photo} alt="" width={260} height={260} sizes="(max-width: 767px) 90px, 200px" className="payment-food" style={{ left: `${point.x}%`, top: `${point.y}%`, width: `${point.size}%`, '--food-delay': `${index * 70}ms` }} /> })}
    {confirmed && <span className="payment-scene-check" aria-hidden="true">✓</span>}
  </div><p className="payment-scene-caption">A little heat. A little tang. <em>Entirely yours.</em></p></section>
}

export function PaymentReceipt({ order }) {
  const plates = order.items.reduce((sum, item) => sum + item.qty, 0)
  return <div className="payment-receipt"><div className="payment-receipt-heading"><h2>Your thali</h2><span>{plates} {plates === 1 ? 'plate' : 'plates'}</span></div><ul className="payment-items">{order.items.map(item => <li key={item.dishId}><div className="payment-item-photo">{dishImage(item.dishId) && <Image src={dishImage(item.dishId)} alt="" width={100} height={100} sizes="72px" />}</div><div className="payment-item-name"><h3>{item.name}</h3><p>Quantity {item.qty}<span>·</span>{rupees(item.unitAmount / 100)} each</p></div><strong>{rupees(item.unitAmount * item.qty / 100)}</strong></li>)}</ul><dl className="payment-totals"><div><dt>Subtotal</dt><dd>{rupees(order.totalAmount / 100)}</dd></div><div><dt>Taxes</dt><dd>Included</dd></div><div className="payment-grand-total"><dt>Total</dt><dd>{rupees(order.totalAmount / 100)}<small>INR</small></dd></div></dl><p className="payment-reference">Order <span>{order.id}</span></p></div>
}

export function PaymentTestCard() {
  return <details className="payment-test-card"><summary><span>Test mode</span>Trying a test payment?<i aria-hidden="true">+</i></summary><div><p>Use Stripe’s test card. No real money will be charged.</p><code>4242 4242 4242 4242</code><p>Any future expiry date · Any 3-digit CVC</p></div></details>
}
