import { useEffect } from 'react'

const clamp = value => Math.max(0, Math.min(1, value))
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x) }

// One motion clock for every route. Decorative values ease toward native scroll;
// the scroll position itself is never intercepted or changed.
export function useSceneMotion(sceneRef, paused = false) {
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const surfaces = () => [...scene.querySelectorAll('[data-motion-surface="ready"]')]
    const findAll = selector => surfaces().flatMap(surface => [...surface.querySelectorAll(selector)])
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    let teardown = () => {}
    const watchedCart = new WeakSet()
    const cart = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (target.id === 'thali') target.closest('.restaurant-site').dataset.thaliVisible = String(isIntersecting)
        else target.dataset.menuActive = String(isIntersecting)
      }
    }, { rootMargin: '-90px 0px -20% 0px' }) : null
    function watchCart() {
      findAll('.menu-section, #thali').forEach(element => {
        if (!watchedCart.has(element)) { watchedCart.add(element); cart?.observe(element) }
      })
    }
    function mode(value) {
      scene.dataset.motion = value
      surfaces().forEach(element => { element.dataset.motion = value })
    }
    function setup() {
      teardown()
      watchCart()
      if (paused || preference.matches || !('IntersectionObserver' in window)) {
        mode('off')
        const mutations = new MutationObserver(() => { mode('off'); watchCart() })
        mutations.observe(scene, { childList: true, subtree: true })
        const surfaceReady = () => { mode('off'); watchCart() }
        addEventListener('tamarind:surface-ready', surfaceReady)
        teardown = () => { mutations.disconnect(); removeEventListener('tamarind:surface-ready', surfaceReady) }
        return
      }
      let frame = 0
      let previousTime = 0
      let needsMeasure = true
      let hero, chef, menu, gallery
      let images = []
      const values = new Map()
      const observed = new WeakSet()
      const observer = new IntersectionObserver(entries => {
        for (const { target, isIntersecting } of entries) {
          if (target.matches('[data-reveal], [data-menu-reveal]')) {
            if (isIntersecting) { target.dataset.visible = 'true'; observer.unobserve(target) }
          } else target.dataset.inView = String(isIntersecting)
        }
      }, { threshold: .04, rootMargin: '80px' })
      function target(element, property, next, unit = '') {
        if (!element) return
        let properties = values.get(element)
        if (!properties) { properties = new Map(); values.set(element, properties) }
        let value = properties.get(property)
        if (!value) {
          value = { current: next, next, unit }
          properties.set(property, value)
          element.style.setProperty(property, next + unit)
        }
        value.next = next
      }
      function measure() {
        const height = innerHeight
        const header = findAll('.site-header')[0]?.getBoundingClientRect().height || 88
        const distance = document.documentElement.scrollHeight - height
        target(scene, '--page-progress', distance > 0 ? scrollY / distance : 0)
        if (hero) {
          const rect = hero.getBoundingClientRect()
          const progress = clamp((header - rect.top) / Math.max(height * .65, rect.height - height + header))
          target(hero, '--hero-exit', progress)
          target(scene, '--coast-land', smooth((progress - .025) / .52))
          target(scene, '--coast-zoom', smooth((progress - .28) / .72))
          target(hero, '--invitation-enter', smooth((progress - .48) / .4))
        }
        if (menu) {
          const rect = menu.getBoundingClientRect()
          const enter = smooth((height - rect.top) / (height * .95))
          target(scene, '--coast-interior', enter)
          target(menu, '--menu-enter', enter)
        }
        if (chef) {
          const rect = chef.getBoundingClientRect()
          const travel = Math.max(height * .7, rect.height - height + header)
          const progress = clamp((header - rect.top + height * .15) / travel)
          target(chef, '--chef-progress', smooth(progress))
        }
        for (const image of images) {
          const rect = image.getBoundingClientRect()
          if (rect.top > height + 150 || rect.bottom < -150) continue
          target(image, '--image-open', smooth((height - rect.top) / (height * .8)))
          target(image, '--media-progress', clamp((height - rect.top) / (height + rect.height)))
        }
        if (gallery) {
          const rect = gallery.getBoundingClientRect()
          const progress = clamp((header - rect.top) / Math.max(1, rect.height - height + header))
          const track = gallery.querySelector('[data-gallery-track]')
          const travel = Math.max(0, track.scrollWidth - track.parentElement.clientWidth)
          target(gallery, '--gallery-travel', -travel * progress, 'px')
          target(gallery, '--gallery-progress', progress)
          target(gallery, '--gallery-enter', smooth((height - rect.top) / (height * .9)))
        }
      }
      function tick(time) {
        frame = 0
        if (needsMeasure) { measure(); needsMeasure = false }
        const elapsed = previousTime ? Math.min(time - previousTime, 40) : 16.7
        previousTime = time
        const ease = 1 - Math.exp(-elapsed / 125)
        let moving = false
        for (const [element, properties] of values) {
          if (!element.isConnected) { values.delete(element); continue }
          for (const [property, value] of properties) {
            const before = value.current
            const delta = value.next - value.current
            const threshold = value.unit ? .04 : .0003
            if (Math.abs(delta) > threshold) { value.current += delta * ease; moving = true }
            else value.current = value.next
            if (before !== value.current) element.style.setProperty(property, value.current + value.unit)
          }
        }
        if (moving || needsMeasure) frame = requestAnimationFrame(tick)
        else previousTime = 0
      }
      function schedule() { needsMeasure = true; if (!frame) frame = requestAnimationFrame(tick) }
      function discover() {
        mode('ready')
        watchCart()
        findAll('[data-reveal], [data-menu-reveal], .dish-portrait, .course-panel-photo, [data-scroll-image], .table-preview-media, .experience-card-media, .reservation-teaser-media').forEach(element => {
          if (observed.has(element)) return
          observed.add(element)
          observer.observe(element)
          const rect = element.getBoundingClientRect()
          if (rect.top < innerHeight && rect.bottom > 0) element.dataset.visible = 'true'
        })
        hero = findAll('[data-hero-scene]')[0]
        chef = findAll('[data-chef-scene]')[0]
        menu = findAll('#menu')[0]
        gallery = findAll('[data-course-gallery]')[0]
        images = findAll('.dish-portrait, .course-panel-photo, [data-scroll-image], .table-preview-media, .experience-card-media, .reservation-teaser-media')
        schedule()
      }
      discover()
      const mutations = new MutationObserver(discover)
      mutations.observe(scene, { childList: true, subtree: true })
      const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
      sizes?.observe(scene)
      addEventListener('tamarind:surface-ready', discover)
      addEventListener('scroll', schedule, { passive: true })
      addEventListener('resize', schedule, { passive: true })
      teardown = () => {
        observer.disconnect(); mutations.disconnect(); sizes?.disconnect(); cancelAnimationFrame(frame)
        removeEventListener('tamarind:surface-ready', discover); removeEventListener('scroll', schedule); removeEventListener('resize', schedule)
        scene.querySelectorAll('.dish-flight').forEach(element => { element.getAnimations().forEach(animation => animation.cancel()); element.remove() })
      }
    }
    setup()
    preference.addEventListener('change', setup)
    return () => { teardown(); cart?.disconnect(); preference.removeEventListener('change', setup) }
  }, [sceneRef, paused])
}
