import { useEffect, useRef } from 'react'
import Image from 'next/image'
import AuthForm from './AuthForm'

export default function AuthDialog({ onClose }) {
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
  }, [])

  return <dialog ref={dialogRef} onClose={onClose} onClick={event => event.target === dialogRef.current && onClose()} aria-label="Sign in or create an account" className="coastal-auth-dialog">
    <button type="button" onClick={onClose} aria-label="Close sign in" className="auth-close">×</button>
    <div className="auth-dialog-scene"><Image src="/images/konark-restaurant.png" alt="" fill sizes="420px" /><p>A little coast.<br />A lot of <em>soul.</em><span>Konark, Odisha</span></p></div>
    <AuthForm onSuccess={onClose} />
  </dialog>
}
