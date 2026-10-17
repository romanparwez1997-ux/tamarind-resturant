import { dayTimeline, stats } from '../data/site'
import { Container, Eyebrow, Wave } from './ui'

export default function About({ service }) {
  const isDinner = service === 'dinner'

  return (
    <section id="about" aria-labelledby="about-title" className="bg-band pt-16 md:pt-24">
      <Container className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16">
        {/* Postcard: daytime sea or night sea, with the chef's quote overlapping it */}
        <figure className="relative lg:mb-10">
          <div
            aria-hidden="true"
            className={`${isDinner ? 'postcard-night' : 'postcard-day'} relative aspect-[4/5] overflow-hidden rounded-[20px] shadow-[0_22px_44px_-24px_rgb(0_0_0/0.5)] before:absolute before:top-[49%] before:left-[20%] before:h-[7%] before:w-[30%] before:bg-tamarind before:[clip-path:polygon(0_0,100%_0,84%_100%,16%_100%)] after:absolute after:top-[30%] after:left-[30%] after:h-[19%] after:w-[14%] after:bg-paper after:[clip-path:polygon(0_100%,100%_100%,0_0)]`}
          />
          <figcaption className="mt-3 font-display text-sm text-fg-soft italic">
            Hoige Bazaar wharf, {isDinner ? '7:40 pm' : '6:04 am'}
          </figcaption>

          {/* Mobile: sits under the postcard. lg: floats over its corner. */}
          <blockquote className="relative mt-8 -rotate-[1.5deg] rounded-[18px] bg-ink px-7 pt-8 pb-6 text-cream shadow-xl before:absolute before:-top-6 before:left-4 before:font-display before:text-7xl before:leading-none before:text-turmeric before:content-['“'] lg:absolute lg:-right-12 lg:-bottom-12 lg:mt-0 lg:w-[68%]">
            <p className="mb-3 font-display text-lg leading-snug italic">
              “If the sea gives us nothing good, we serve vegetables and apologise with dessert.”
            </p>
            <cite className="text-xs font-bold tracking-widest text-turmeric uppercase not-italic">Chef Asha Kotian</cite>
          </blockquote>
        </figure>

        <div>
          <Eyebrow>Our story</Eyebrow>
          <h2 id="about-title" className="mb-5 font-display text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">
            A fisherman's daughter and her grandmother's grinding stone
          </h2>
          <p className="mb-4 max-w-[60ch]">
            Chef Asha Kotian grew up three streets from the old port, where the day started with the boats
            and ended with fish curry. Tamarind &amp; Tide is her grandmother's kitchen, scaled up just
            enough to seat thirty-two people.
          </p>
          <p className="max-w-[60ch] text-fg-soft">
            We buy at the wharf every morning and write the menu once we know what came in. Masalas are
            roasted and ground in-house, coconut is scraped by hand, and nothing from the sea ever sees a freezer.
          </p>

          <ul className="mt-8 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <li key={stat.label} className="rounded-[18px] border border-line bg-page px-3 py-4 sm:px-5">
                <strong className="block font-display text-2xl leading-tight text-chili sm:text-3xl">{stat.value}</strong>
                <span className="text-xs text-fg-soft sm:text-sm">{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* A day at Tamarind & Tide: vertical list on phones, 5 columns from md */}
      <Container className="pt-20 pb-16 md:pb-24">
        <h3 className="mb-8 font-display text-2xl font-bold">A day at Tamarind &amp; Tide</h3>
        <ol className="grid gap-4 md:grid-cols-5 md:gap-3">
          {dayTimeline.map((step) => {
            const isNow = step.service === service // highlight the current service
            return (
              <li
                key={step.time}
                className={`relative rounded-[18px] border p-4 transition-colors duration-500 ${
                  isNow ? 'border-turmeric bg-turmeric text-ink' : 'border-line bg-page'
                }`}
              >
                {isNow && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-chili px-2 py-0.5 text-[10px] font-bold tracking-wider text-paper uppercase">
                    Now
                  </span>
                )}
                <p className="font-display text-xl font-bold">{step.time}</p>
                <p className="font-bold">{step.title}</p>
                <p className={`text-sm ${isNow ? 'text-ink/80' : 'text-fg-soft'}`}>{step.text}</p>
              </li>
            )
          })}
        </ol>
      </Container>

      <Wave className="text-page" />
    </section>
  )
}
