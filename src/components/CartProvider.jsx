'use client'
import { useCallback, useSyncExternalStore } from 'react'
import { CartContext } from '../lib/cartContext'
import { EMPTY_CART, readCart, writeCart, subscribeCart } from '../lib/cartStorage'
const serverCart = () => EMPTY_CART

// A session-only draft survives page changes and reloads. Checkout reprices it.
export default function CartProvider({ children }) {
  const quantities = useSyncExternalStore(subscribeCart,readCart,serverCart)
  const setQuantities = useCallback(update => writeCart(typeof update === 'function' ? update(readCart()) : update),[])
  return <CartContext.Provider value={{quantities,setQuantities}}>{children}</CartContext.Provider>
}
