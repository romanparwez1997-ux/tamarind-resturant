// Consistent JSON errors for every application route.
export function withErrors(handler) {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (error) {
      // Only explicitly public server errors may expose a message (e.g. Stripe
      // not configured). Database and unexpected failures keep a generic body.
      if (Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 &&
          (error.status < 500 || error.expose === true)) {
        return Response.json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return Response.json({ error: 'Something went wrong on the server.' }, { status: 500 })
    }
  }
}

export async function readJson(request) {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body
  } catch {
    throw Object.assign(new Error('Send a valid JSON object.'), { status: 400 })
  }
}
