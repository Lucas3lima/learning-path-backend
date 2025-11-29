import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string(),
})

const env = envSchema.safeParse(process.env)

if (!env.success) {
  console.error('❌ Erro nas variáveis de ambiente:')
  console.table(env.error.format())
  process.exit(1)
}

export const config = env.data
