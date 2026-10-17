// Reusable Tailwind class strings, so every button looks the same.
// Use: <a className={btn}>  or  <a className={`${btn} ${btnSmall}`}>

export const btn =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-chili bg-chili px-6 py-3.5 font-bold leading-tight text-paper no-underline transition cursor-pointer hover:-translate-y-0.5 hover:border-chili-dark hover:bg-chili-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-fg bg-transparent px-6 py-3.5 font-bold leading-tight text-fg no-underline transition cursor-pointer hover:-translate-y-0.5 hover:bg-fg hover:text-page'

export const btnSmall = 'px-4 py-2 text-sm'

// small uppercase form labels
export const fieldLabel = 'text-xs font-bold tracking-widest uppercase'
