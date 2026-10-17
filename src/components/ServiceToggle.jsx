// CONTROLLED switch: shows `value` ('lunch' | 'dinner') and asks the
// parent to change it through `onChange`. It stores nothing itself.
export default function ServiceToggle({ value, onChange }) {
  const isDinner = value === 'dinner'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDinner}
      aria-label="Dinner service"
      onClick={() => onChange(isDinner ? 'lunch' : 'dinner')}
      className="relative inline-flex h-10 w-36 flex-none cursor-pointer items-center rounded-full border border-line bg-card p-1 text-xs font-bold"
    >
      {/* the sliding knob */}
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition duration-300 ${
          isDinner ? 'translate-x-full bg-turmeric' : 'bg-ink'
        }`}
      />
      <span className={`relative z-10 flex-1 text-center transition-colors ${isDinner ? 'text-fg-soft' : 'text-paper'}`}>
        ☀ Lunch
      </span>
      <span className={`relative z-10 flex-1 text-center transition-colors ${isDinner ? 'text-ink' : 'text-fg-soft'}`}>
        ☾ Dinner
      </span>
    </button>
  )
}
