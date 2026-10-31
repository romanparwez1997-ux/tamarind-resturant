// A shared-image transition connects the actual menu photo to the live thali.
export function plateDish(dishId, source) {
  const scene = source?.closest('.restaurant-site')
  if (!scene || scene.dataset.motion !== 'ready') return
  const picture = source.closest('[data-dish-card]')?.querySelector('.dish-portrait img')
  if (!picture?.complete || !picture.naturalWidth) return
  const destinations = [...scene.querySelectorAll('[data-thali-stage], [data-thali-dock]')]
  const target = destinations.find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.top >= 75 && rect.bottom <= innerHeight && getComputedStyle(element).visibility !== 'hidden'
  })
  if (!target) return
  const from = picture.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const width = Math.min(from.width, 200)
  const flight = document.createElement('div')
  flight.className = 'dish-flight'
  flight.setAttribute('aria-hidden', 'true')
  flight.dataset.dishId = dishId
  Object.assign(flight.style, { position: 'fixed', left: `${from.left + (from.width - width) / 2}px`, top: `${from.top}px`, width: `${width}px`, height: `${width}px` })
  const image = document.createElement('img')
  image.src = picture.currentSrc || picture.src
  image.alt = ''
  flight.append(image)
  scene.append(flight)
  const x = to.left + to.width / 2 - from.left - from.width / 2
  const y = to.top + to.height / 2 - from.top - width / 2
  const scale = Math.max(.22, Math.min(.55, to.width / width * .3))
  const animation = flight.animate([
    { transform: 'translate3d(0,0,0) scale(.92)', opacity: .95 },
    { offset: .45, transform: `translate3d(${x * .4}px,${y * .4 - 75}px,0) scale(.72) rotate(-9deg)`, opacity: 1 },
    { transform: `translate3d(${x}px,${y}px,0) scale(${scale}) rotate(0deg)`, opacity: 0 },
  ], { duration: 760, easing: 'cubic-bezier(.22,.68,.25,1)' })
  const cleanup = () => flight.remove()
  animation.onfinish = cleanup
  animation.oncancel = cleanup
}
