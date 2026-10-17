import { btn, btnGhost } from '../classes'
import { heroFacts, services } from '../data/site'
import Ticker from './Ticker'
import { Container } from './ui'

export default function Hero({ service }) {
  const info = services[service] // the lunch or dinner text
  const isDinner = service === 'dinner'

  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="bg-[radial-gradient(circle_at_88%_18%,rgb(233_162_59/0.25),transparent_42%)]"
    >
      <Container className="grid items-center gap-10 pt-10 pb-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16 lg:pb-20">
        <div>
          {/* live "now serving" pill */}
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-bold tracking-[0.12em] uppercase">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full rounded-full bg-leaf opacity-60 motion-safe:animate-ping" />
              <span className="relative size-2.5 rounded-full bg-leaf" />
            </span>
            Now serving {info.label} · {info.hours}
          </p>

          <h1 id="hero-title" className="mb-6 font-display text-6xl leading-[0.92] font-extrabold tracking-tight sm:text-8xl lg:text-[7rem]">
            <span className="block">Tamarind</span>
            <span className="block">
              <span className="font-normal text-chili italic">&amp;</span>{' '}
              {/* outlined letters: transparent fill + a text stroke */}
              <span className="text-transparent [-webkit-text-stroke:2px_var(--color-fg)]">Tide</span>
            </span>
          </h1>

          <p className="max-w-[50ch] text-lg text-fg-soft">{info.lede}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#reserve" className={btn}>Pick your table</a>
            <a href="#menu" className={btnGhost}>Build a thali</a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {heroFacts.map((fact) => (
              <li key={fact} className="flex items-center gap-2 before:size-2 before:rounded-full before:bg-turmeric">
                {fact}
              </li>
            ))}
          </ul>
        </div>

        {/* Plate under a sun (lunch) or a moon (dinner). All CSS gradients. */}
        <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[440px]">
          <div
            className={`absolute top-[2%] left-[2%] size-[30%] rounded-full transition duration-700 ${
              isDinner ? 'bg-[#ece6d3] shadow-[0_0_70px_18px_rgb(236_230_211/0.25)]' : 'bg-turmeric/70'
            }`}
          />
          <div className="plate-art absolute inset-[9%] rounded-full shadow-[0_22px_44px_-24px_rgb(0_0_0/0.5)]">
            <div className="leaf-art absolute inset-[17%] -rotate-12 rounded-[70%_8%_70%_8%]" />
            <div className="food-art absolute inset-[22%] rounded-full" />
          </div>
          <svg viewBox="0 0 200 200" className="absolute top-0 right-0 w-[36%] motion-safe:animate-spin-slow">
            <defs>
              <path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
            </defs>
            <circle cx="100" cy="100" r="96" className="fill-turmeric" />
            <text className="fill-ink font-body text-[15px] font-bold tracking-[1px]">
              <textPath href="#badge-circle" textLength="458">{info.badge}</textPath>
            </text>
            <text x="100" y="112" textAnchor="middle" className="fill-chili text-[34px]">✦</text>
          </svg>
        </div>
      </Container>

      <Ticker label={info.catchLabel} />
    </section>
  )
}
