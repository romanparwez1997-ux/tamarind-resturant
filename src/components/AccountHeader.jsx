import Link from 'next/link'
export default function AccountHeader({ user }) {
  return <header className="account-header"><Link href="/" className="payment-brand"><span aria-hidden="true">✳</span><span>Tamarind <i>&amp;</i> Tide<small>Coastal kitchen · Konark, Odisha</small></span></Link><nav aria-label="Account navigation"><Link href="/#menu">Explore the menu <span aria-hidden="true">↗</span></Link>{user && <Link href="/account" className="account-header-avatar" aria-label="My account">{user.name?.slice(0, 1) || 'T'}</Link>}</nav></header>
}
