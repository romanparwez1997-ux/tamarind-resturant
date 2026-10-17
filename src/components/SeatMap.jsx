import { tableWidth } from '../data/tables'

// A row of little chair dots above or below a table
function Chairs({ count, className }) {
  return (
    <span aria-hidden="true" className="flex w-full justify-evenly">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`size-1.5 rounded-full sm:size-2 ${className}`} />
      ))}
    </span>
  )
}

// What each table looks like in each state
const look = {
  free: { top: 'bg-[#d9b98a] text-ink group-hover:bg-turmeric', chair: 'bg-ink/45' },
  selected: { top: 'bg-chili text-paper ring-4 ring-turmeric', chair: 'bg-chili' },
  booked: { top: 'bg-ink/10 text-ink/40 line-through', chair: 'bg-ink/15' },
  small: { top: 'bg-ink/10 text-ink/40', chair: 'bg-ink/15' },
}

// CONTROLLED floor plan: shows which table is chosen (`selectedId`) and
// reports clicks through `onSelect`. It never stores a choice itself.
export default function SeatMap({ tables, guests, booked, selectedId, onSelect }) {
  function statusOf(table) {
    if (booked.includes(table.id)) return 'booked'
    if (table.seats < guests) return 'small'
    if (table.id === selectedId) return 'selected'
    return 'free'
  }

  const freeCount = tables.filter((t) => !booked.includes(t.id) && t.seats >= guests).length

  return (
    <div className="rounded-[20px] bg-paper p-3 text-ink sm:p-4">
      <div className="flex items-center justify-between px-1 pb-2 text-[11px] font-bold tracking-widest text-ink-soft uppercase">
        <span>≈ Arabian Sea · windows</span>
        <span>
          {freeCount} free for {guests}
        </span>
      </div>

      {/* The floor. Tables are positioned with % so the plan scales with the screen. */}
      <div className="floor-art relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-ink/15 sm:aspect-[16/10]">
        <div className="absolute right-[3%] bottom-[5%] grid h-[24%] w-[36%] place-items-center rounded-lg border-2 border-dashed border-ink/25 bg-ink/5 text-[10px] font-bold tracking-widest text-ink/50 uppercase">
          Kitchen
        </div>

        {tables.map((table) => {
          const status = statusOf(table)
          const half = table.seats / 2
          return (
            <button
              key={table.id}
              type="button"
              disabled={status === 'booked' || status === 'small'}
              aria-pressed={status === 'selected'}
              aria-label={`Table ${table.id}, ${table.seats} seats, ${table.zone}, ${status === 'selected' ? 'selected' : status === 'free' ? 'available' : status === 'booked' ? 'taken' : 'too small'}`}
              onClick={() => onSelect(table.id)}
              style={{ left: `${table.x}%`, top: `${table.y}%`, width: `${tableWidth[table.seats]}%` }}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1 disabled:cursor-not-allowed"
            >
              <Chairs count={half} className={look[status].chair} />
              <span className={`grid h-7 w-full place-items-center rounded-md text-[10px] font-bold transition sm:h-9 sm:text-xs ${look[status].top}`}>
                {table.id}
              </span>
              <Chairs count={half} className={look[status].chair} />
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-ink-soft">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#d9b98a]" />Free</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-chili" />Your table</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-ink/10" />Taken or too small</li>
      </ul>
    </div>
  )
}
