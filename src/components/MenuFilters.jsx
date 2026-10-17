import { courses, spiceLabels } from '../data/menu'
import { fieldLabel } from '../classes'
import { DietMark } from './ui'

// Fully controlled: the three filter values live in Menu and come in as props.
// Every control just reports the user's choice back through an on...Change prop.
export default function MenuFilters({ course, onCourseChange, counts, vegOnly, onVegOnlyChange, maxSpice, onMaxSpiceChange }) {
  const tab = (active) =>
    `inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 font-bold transition ${
      active ? 'bg-fg text-page' : 'hover:bg-page'
    }`

  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
      {/* 1. Course tabs, each with a live count of matching dishes */}
      <div role="group" aria-label="Choose a course" className="flex flex-wrap gap-1">
        {courses.map((c) => (
          <button key={c.id} type="button" aria-pressed={course === c.id} onClick={() => onCourseChange(c.id)} className={tab(course === c.id)}>
            {c.label}
            <span className={`rounded-full px-1.5 text-xs ${course === c.id ? 'bg-page/20' : 'bg-line'}`}>{counts[c.id]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1">
        {/* 2. Veg-only switch */}
        <button
          type="button"
          role="switch"
          aria-checked={vegOnly}
          onClick={() => onVegOnlyChange(!vegOnly)}
          className="inline-flex cursor-pointer items-center gap-2.5 font-bold"
        >
          <span className={`relative h-6 w-11 rounded-full transition ${vegOnly ? 'bg-leaf' : 'bg-line'}`}>
            <span className={`absolute top-1 left-1 size-4 rounded-full bg-paper shadow transition ${vegOnly ? 'translate-x-5' : ''}`} />
          </span>
          <DietMark veg />
          Veg only
        </button>

        {/* 3. Spice slider: a controlled <input>. value comes from state,
               onChange sends the new number back up. */}
        <label className="flex items-center gap-3">
          <span className={`${fieldLabel} text-fg-soft`}>Max heat</span>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={maxSpice}
            onChange={(e) => onMaxSpiceChange(Number(e.target.value))}
            className="w-24 cursor-pointer accent-chili sm:w-28"
          />
          <span className="w-16 text-sm font-bold">{spiceLabels[maxSpice]}</span>
        </label>
      </div>
    </div>
  )
}
