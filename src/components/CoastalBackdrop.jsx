import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSiteMotion } from '../lib/motionContext'

// No animation runs against the visitor's reduced-motion preference.
export function OceanFilm({ paused = false, sceneId, className = '' }) {
  const ref = useRef(null)
  const { paused: sitePaused } = useSiteMotion()
  useEffect(() => {
    const video = ref.current
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    const sync = () => {
      if (paused || sitePaused || preference.matches || document.hidden || !visible) video.pause()
      else video.play().catch(() => {}) // The still photograph also covers blocked autoplay.
    }
    const scene = sceneId && document.getElementById(sceneId)
    const observer = scene && 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }) : null
    if (scene) observer?.observe(scene)
    preference.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => { video.pause(); observer?.disconnect(); preference.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync) }
  }, [paused, sitePaused, sceneId])
  return <video ref={ref} className={className} muted loop playsInline preload="none" poster="/images/konark-restaurant.png" aria-hidden="true" tabIndex={-1}><source src="/videos/konark-ocean.mp4" type="video/mp4" /></video>
}

export default function CoastalBackdrop({ paused }) {
  return <div className="coastal-backdrop" aria-hidden="true">
    <OceanFilm paused={paused} sceneId="home" className="coastal-ocean" />
    <Image src="/images/konark-restaurant.png" alt="" fill sizes="100vw" priority className="coastal-exterior" />
    <Image src="/images/dining-room.png" alt="" fill sizes="100vw" className="coastal-interior" />
    <div className="coastal-backdrop-shade" />
  </div>
}
