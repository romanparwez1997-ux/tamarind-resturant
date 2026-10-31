'use client'

import { useEffect, useRef } from 'react'
import { useSiteMotion } from '../lib/motionContext'

// Each streamed page opts in after its own hydration. The shared clock must not
// alter HTML inside a Suspense boundary before React has attached to that page.
export default function MotionSurface({ children, ...props }) {
  const ref = useRef(null)
  const { paused } = useSiteMotion()
  useEffect(() => {
    const element = ref.current
    element.dataset.motionSurface = 'ready'
    element.dataset.motion = paused ? 'off' : 'ready'
    dispatchEvent(new Event('tamarind:surface-ready'))
    return () => { delete element.dataset.motionSurface }
  }, [paused])
  return <div ref={ref} {...props}>{children}</div>
}
