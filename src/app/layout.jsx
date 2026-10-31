import './globals.css'
import SiteMotion from '../components/SiteMotion'
import CartProvider from '../components/CartProvider'

// Next.js requires metadata alongside the root layout component.
// oxlint-disable-next-line react/only-export-components
export const metadata = {
  title: 'Tamarind & Tide — Coastal Kitchen, Konark, Odisha',
  description: 'Tamarind & Tide is a 32-seat coastal kitchen in Konark, Odisha. Fish off the morning boats, hand-ground coconut and slow ghee roasts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body><SiteMotion><CartProvider>{children}</CartProvider></SiteMotion></body>
    </html>
  )
}
