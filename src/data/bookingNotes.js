export function bookingNote(name, occasion) {
  const first = String(name || 'friend').trim().split(/\s+/)[0] || 'friend'
  const personal = occasion === 'Birthday'
    ? 'Here’s to another lovely year. We’re so happy to be a little part of your celebration.'
    : occasion === 'Anniversary'
      ? 'Some evenings deserve to be remembered. We’re honoured you’re spending this one with us.'
      : occasion === 'First visit'
        ? 'Your first evening with us should feel like coming home. We can’t wait to welcome you.'
        : 'Bring your favourite people, leave the rush at the door, and let the evening take its time.'
  return { greeting: `Dear ${first},`, message: personal, closing: 'Your table is saved. A warm welcome is waiting.', signature: 'With love, the Tamarind & Tide team' }
}
