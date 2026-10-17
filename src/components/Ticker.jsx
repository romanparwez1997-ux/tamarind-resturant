import { todaysCatch } from '../data/menu'

// The fish list is rendered twice side by side and the strip slides left
// by 50%, so the loop has no visible jump. The copy is hidden from screen readers.
export default function Ticker({ label }) {
  return (
    <div className="group flex items-stretch bg-ink text-cream">
      <p className="flex flex-none items-center bg-chili px-4 py-3.5 text-xs font-bold tracking-[0.12em] uppercase">
        {label}
      </p>
      {/* min-w-0 lets this shrink instead of making the page wider */}
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        <div className="flex w-max motion-safe:animate-ticker group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex gap-10 px-5 font-display text-[1.05rem] whitespace-nowrap">
              {todaysCatch.map((fish) => (
                <li key={fish} className="before:mr-10 before:text-turmeric before:content-['✦']">
                  {fish}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  )
}
