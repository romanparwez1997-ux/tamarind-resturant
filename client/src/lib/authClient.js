import { createAuthClient } from 'better-auth/react'

// Talks to Better Auth on our server at /api/auth/* (same site, through the
// proxy), so no URL is needed here.
//   authClient.useSession()               -> { data: session, isPending }
//   authClient.signUp.email({...})        -> create an account (also signs in)
//   authClient.signIn.email({...})        -> log in
//   authClient.signOut()                  -> log out
// The session lives in an httpOnly cookie that the browser sends with every
// request, which is why you stay signed in after a page refresh.
export const authClient = createAuthClient()
