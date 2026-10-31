import { useEffect, useSyncExternalStore } from 'react'

function subscribe(listener) {
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
function savedService() {
  try { return sessionStorage.getItem('tamarind:payment-service') === 'dinner' ? 'dinner' : 'lunch' } catch { return 'lunch' }
}
const serverService = () => 'lunch'

// Keep the restaurant's service palette through the Stripe redirect. No order
// information or credentials are stored in the browser.
export function usePaymentService(initialService) {
  const valid = ['lunch', 'dinner'].includes(initialService)
  const saved = useSyncExternalStore(subscribe, savedService, serverService)
  useEffect(() => {
    try {
      if (valid) sessionStorage.setItem('tamarind:payment-service', initialService)
    } catch { /* Checkout also works when browser storage is unavailable. */ }
  }, [initialService, valid])
  return valid ? initialService : saved
}
