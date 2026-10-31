import { pool } from '@/server/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const report = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || null, // not secret: it's the public site address
    },
    payments: {
      testKeyConfigured: /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || ''),
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_')),
    },
  }
  try {
    const { rows } = await pool.query(
      `SELECT to_regclass('public.dishes') IS NOT NULL AS dishes, to_regclass('public."user"') IS NOT NULL AS users,
              to_regclass('public.orders') IS NOT NULL AS orders, to_regclass('public.order_items') IS NOT NULL AS order_items`,
    )
    report.database = 'connected'
    report.tables = Object.values(rows[0]).every(Boolean) ? 'ok' : 'missing: run npm run db:migrate and db:seed against this database'
  } catch (err) {
    report.database = `cannot connect (${err.code || 'error'})`
  }
  report.ok = Boolean(report.database === 'connected' && report.tables === 'ok' && report.env.BETTER_AUTH_SECRET)
  return Response.json(report, { status: report.ok ? 200 : 500 })
}
