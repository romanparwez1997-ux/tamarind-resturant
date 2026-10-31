// Redirects supplied in a query string must remain relative to this origin.
export function localReturnPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') &&
    !value.includes('\\') && ![...value].some(character => character.charCodeAt(0) < 32)
    ? value : '/account'
}
