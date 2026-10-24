import { rupees } from '../utils'
import PortionStepper from './PortionStepper'
import { DietMark, SpiceMeter } from './ui'

// One dish. Receives the dish, its current quantity and a function to change
// it. It never stores the quantity itself.
export default function DishCard({ dish, quantity, onQuantityChange }) {
  const onLeaf = quantity > 0

  return (
    <li
      className={`relative flex flex-col gap-3 rounded-[20px] border bg-card p-5 transition motion-safe:animate-rise sm:p-6 ${
        onLeaf ? 'border-turmeric ring-2 ring-turmeric/60' : 'border-line hover:-translate-y-1 hover:shadow-[0_22px_44px_-24px_rgb(0_0_0/0.45)]'
      }`}
    >
      {dish.chefsPick && (
        <span className="absolute -top-3 right-5 rotate-3 rounded-md bg-turmeric px-2 py-0.5 text-[11px] font-extrabold tracking-wider text-ink uppercase shadow">
          Chef's pick
        </span>
      )}

      {/* name ········ price, like a printed menu */}
      <div className="flex items-baseline gap-2.5">
        <DietMark veg={dish.veg} />
        <h4 className="min-w-0 font-display text-xl leading-tight font-bold">{dish.name}</h4>
        <span aria-hidden="true" className="min-w-4 flex-1 border-b-2 border-dotted border-line" />
        <span className="font-display font-bold whitespace-nowrap text-chili">{rupees(dish.price)}</span>
      </div>

      <p className="text-[0.95rem] text-fg-soft">{dish.description}</p>

      {/* mt-auto pushes this row to the bottom so steppers line up */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {dish.spice > 0 && <SpiceMeter level={dish.spice} />}
          {dish.tag && <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-bold">{dish.tag}</span>}
          {onLeaf && <span className="text-xs font-bold text-leaf">✓ On your leaf</span>}
        </div>

        <PortionStepper value={quantity} onChange={onQuantityChange} label={dish.name} />
      </div>
    </li>
  )
}
