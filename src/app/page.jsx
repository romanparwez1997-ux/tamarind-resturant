import App from '../App'

// Choose lunch/dinner at request time in the restaurant's timezone.
export const dynamic = 'force-dynamic'

export default function HomePage() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23',
  // Request-time server rendering intentionally reads the current clock.
  // oxlint-disable-next-line react/purity
  }).format(new Date()))
  return <App initialService={hour < 16 ? 'lunch' : 'dinner'} />
}
