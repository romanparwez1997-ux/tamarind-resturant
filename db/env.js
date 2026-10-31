// Use the same .env.local / .env loading as the Next.js app for CLI scripts.
import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())
