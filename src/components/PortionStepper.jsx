// CONTROLLED stepper (same pattern as QuantityStepper in BrewHaus).
// It has NO state of its own:
//   - the parent passes the number in as `value`
//   - clicking − or + calls onChange(newNumber); the parent decides what to store
//   - the parent re-renders us with the new `value`
// Used twice: plates per dish (DishCard) and number of guests (Reserve).

export default function PortionStepper({ value, onChange, min = 0, max = 9, label }) {
  const btnClass =
    'grid size-9 cursor-pointer place-items-center rounded-full text-lg font-bold transition enabled:hover:bg-fg enabled:hover:text-page disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-line bg-page p-0.5 text-fg">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`One less: ${label}`}
        className={btnClass}
      >
        −
      </button>

      <span aria-live="polite" className="w-7 text-center font-bold tabular-nums">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`One more: ${label}`}
        className={btnClass}
      >
        +
      </button>
    </div>
  )
}
