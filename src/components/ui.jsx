// Small presentational components used by several sections.

// Centres content at the site width with side gutters
export function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 ${className}`}>{children}</div>
}

// Small uppercase label with a line in front of it
export function Eyebrow({ className = 'text-sea', children }) {
  return (
    <p className={`mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.14em] uppercase before:h-0.5 before:w-7 before:flex-none before:bg-current ${className}`}>
      {children}
    </p>
  )
}

// Indian veg (green dot) / non-veg (brown triangle) symbol
export function DietMark({ veg, className = '' }) {
  return (
    <span
      role="img"
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-grid size-4 flex-none translate-y-0.5 place-items-center rounded-[3px] border-2 border-current ${veg ? 'text-leaf' : 'text-tamarind'} ${className}`}
    >
      <span className={`size-[7px] bg-current ${veg ? 'rounded-full' : '[clip-path:polygon(50%_0,100%_100%,0_100%)]'}`} />
    </span>
  )
}

// Three bars, filled up to the dish's spice level
export function SpiceMeter({ level }) {
  return (
    <span className="inline-flex items-center gap-1" title={`Spice ${level} of 3`}>
      <span className="sr-only">Spice level {level} of 3</span>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={`h-3.5 w-1.5 rounded-full ${n <= level ? 'bg-chili' : 'bg-line'}`}
        />
      ))}
    </span>
  )
}

// Wavy divider between sections. Its colour = text colour (currentColor),
// so <Wave className="text-ink" /> draws an ink-coloured wave.
export function Wave({ className = '' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 60" preserveAspectRatio="none" className={`block h-8 w-full sm:h-12 ${className}`}>
      <path fill="currentColor" d="M0 30 C 240 0 480 60 720 30 C 960 0 1200 60 1440 30 V60 H0 Z" />
    </svg>
  )
}
