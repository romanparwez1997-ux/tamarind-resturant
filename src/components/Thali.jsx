import { btn, btnGhost, btnSmall } from '../classes'
import { rupees } from '../utils'

// Bowl colour by course. Full class names (not built from pieces) so
// Tailwind can find them when it scans the code.
const bowlStyle = {
  starters: 'bg-turmeric text-ink',
  mains: 'bg-chili text-paper',
  desserts: 'bg-[#f3e6c8] text-ink',
}

// Shows the picked dishes as steel bowls round a banana leaf, plus the bill.
// It only DISPLAYS data; App works out `thali` and owns the quantities.
export default function Thali({ thali, onClear }) {
  const { items, plates, total } = thali

  return (
    <aside id="thali" aria-labelledby="thali-title" className="rounded-[24px] border border-line bg-card p-5 lg:sticky lg:top-24">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="thali-title" className="font-display text-2xl font-bold">Your thali</h3>
        <span className="text-sm text-fg-soft">
          {plates} {plates === 1 ? 'plate' : 'plates'}
        </span>
      </div>

      {/* The plate */}
      <div className="relative mx-auto my-5 aspect-square w-full max-w-[290px]">
        <div className="plate-art absolute inset-0 rounded-full shadow-[0_18px_36px_-20px_rgb(0_0_0/0.5)]" />
        <div className="leaf-art absolute inset-[7%] rounded-full" />

        {plates === 0 ? (
          <p className="absolute inset-[22%] grid place-items-center text-center font-display text-sm text-paper italic">
            Your leaf is empty. Tap + on any dish.
          </p>
        ) : (
          <div className="absolute inset-[37%] grid place-items-center rounded-full bg-[#fffdf6] text-[10px] font-bold text-ink shadow-inner">
            rice
          </div>
        )}

        {/* One bowl per dish, spaced evenly round a circle.
            angle -> x/y with cos/sin. Positions are calculated numbers, so they
            go in `style`; Tailwind classes can't be built at runtime. */}
        {items.map((item, i) => {
          const angle = (i / items.length) * 2 * Math.PI - Math.PI / 2 // start at 12 o'clock
          const x = 50 + 33 * Math.cos(angle)
          const y = 50 + 33 * Math.sin(angle)
          return (
            <span
              key={item.dish.id}
              title={item.dish.name}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`absolute grid size-[20%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-[#cfd5d6] text-xs font-extrabold shadow-md transition-all duration-500 motion-safe:animate-pop ${bowlStyle[item.dish.course]}`}
            >
              ×{item.qty}
            </span>
          )
        })}
      </div>

      {/* The bill */}
      {items.length > 0 && (
        <ul className="mb-4 space-y-1.5 text-sm">
          {items.map(({ dish, qty }) => (
            <li key={dish.id} className="flex items-baseline gap-2">
              <span className={`size-2.5 flex-none rounded-full ${bowlStyle[dish.course]}`} />
              <span className="min-w-0">
                {dish.name} <span className="text-fg-soft">×{qty}</span>
              </span>
              <span aria-hidden="true" className="min-w-3 flex-1 border-b border-dotted border-line" />
              <span className="font-bold tabular-nums">{rupees(dish.price * qty)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-bold">Total</span>
        <span className="font-display text-2xl font-bold text-chili">{rupees(total)}</span>
      </div>
      <p className="mt-1 text-xs text-fg-soft">Prices include taxes. Pre-ordered plates are ready when you sit down.</p>

      {plates > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onClear} className={`${btnGhost} ${btnSmall}`}>
            Clear leaf
          </button>
          <a href="#reserve" className={`${btn} ${btnSmall} flex-1`}>
            Book with this thali
          </a>
        </div>
      )}
    </aside>
  )
}
