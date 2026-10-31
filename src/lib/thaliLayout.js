// Shared photo positions for the menu builder and checkout preview.
export function thaliPlacement(index, count) {
  if (count === 1) return { x: 50, y: 50, size: 57 }
  if (count === 2) return { x: index ? 67 : 33, y: index ? 59 : 42, size: 43 }
  if (count === 3) return [{ x: 50, y: 29, size: 40 }, { x: 30, y: 64, size: 40 }, { x: 70, y: 64, size: 40 }][index]
  if (count === 4) return { x: index % 2 ? 68 : 32, y: index > 1 ? 68 : 32, size: 38 }
  if (count <= 7) {
    const angle = index / count * Math.PI * 2 - Math.PI / 2
    return { x: 50 + Math.cos(angle) * 29, y: 50 + Math.sin(angle) * 29, size: count <= 5 ? 34 : 30 }
  }
  const inner = index < 3
  const angle = (inner ? index / 3 : (index - 3) / (count - 3)) * Math.PI * 2 - Math.PI / 2
  return { x: 50 + Math.cos(angle) * (inner ? 15 : 35), y: 50 + Math.sin(angle) * (inner ? 15 : 35), size: 26 }
}
