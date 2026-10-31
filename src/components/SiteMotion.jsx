'use client'

import { useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { MotionContext } from '../lib/motionContext'
import { useSceneMotion } from '../hooks/useSceneMotion'
import { OceanFilm } from './CoastalBackdrop'

const eventName = 'tamarind:motion-change'
let transientPaused = null
function subscribe(listener) {
  addEventListener(eventName, listener)
  addEventListener('storage', listener)
  return () => { removeEventListener(eventName, listener); removeEventListener('storage', listener) }
}
function saved() { if (transientPaused !== null) return transientPaused; try { return sessionStorage.getItem('tamarind:motion-paused') === 'true' } catch { return false } }
const serverValue = () => false
function subscribeReduced(listener) {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
const reducedValue = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export default function SiteMotion({ children }) {
  const ref = useRef(null)
  const pathname = usePathname()
  const manualPaused = useSyncExternalStore(subscribe, saved, serverValue)
  const reduced = useSyncExternalStore(subscribeReduced, reducedValue, serverValue)
  const paused = manualPaused || reduced
  function toggle() {
    if (reduced) return
    transientPaused = !manualPaused
    try { sessionStorage.setItem('tamarind:motion-paused', String(!manualPaused)) } catch { /* A private preference is optional. */ }
    dispatchEvent(new Event(eventName))
  }
  useSceneMotion(ref, paused)
  return <MotionContext.Provider value={{ paused, reduced, toggle }}><div ref={ref} className="site-motion" data-page={pathname === '/' ? 'home' : 'interior'}>
    <div className="ambient-ocean" aria-hidden="true"><OceanFilm paused={pathname === '/'} className="ambient-film" /><div className="ambient-wash" /><div className="ambient-light" /></div>
    {children}
    <button type="button" className="coastal-motion-control" aria-pressed={paused} disabled={reduced} onClick={toggle}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span>{reduced ? 'Motion reduced' : paused ? 'Resume motion' : 'Pause motion'}</button>
  </div></MotionContext.Provider>
}
