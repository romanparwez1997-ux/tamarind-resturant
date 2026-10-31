import { auth } from './auth.js'

// Validate the real session on every protected route, never a browser user ID.
export async function requireAuth(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw Object.assign(new Error('Please sign in first.'), { status: 401 })
  return session.user
}
