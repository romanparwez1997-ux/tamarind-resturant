import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'

// Put this in front of any route that needs a signed-in user:
//   router.post('/', requireAuth, handler)
// It reads the session cookie, asks Better Auth who it belongs to, and either
// stops with 401 or puts the user on req.user for the next handler.
export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })

  if (!session) {
    return res.status(401).json({ error: 'Please sign in first.' })
  }

  req.user = session.user
  next()
}
