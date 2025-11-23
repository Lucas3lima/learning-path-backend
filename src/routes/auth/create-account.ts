import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { userPlants, userRoleValues, users } from '../../database/schema.ts'
export const createAccountRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create account',
        body: z.object({
          name: z.string(),
          email: z.email(),
          password: z.string().min(4),
          registration_number: z.string(),
          role: z.enum(userRoleValues).nullable(),
          plant_id: z.uuid(),
        }),
        response: {
          201: z.object({
            userId: z.uuid(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, registration_number, role, plant_id } =
        request.body

      const userWithSameEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (userWithSameEmail.length > 0) {
        throw new Error('Email already exists')
      }

      const userWithSameRegistrationNumber = await db
        .select()
        .from(users)
        .where(eq(users.registration_number, registration_number))
        .limit(1)

      if (userWithSameRegistrationNumber.length > 0) {
        throw new Error('Registration number already exists')
      }

      const password_hash = await hash(password, 6)

      const result = await db
        .insert(users)
        .values({
          name,
          email,
          password_hash,
          registration_number,
          role: role ?? 'user',
        })
        .returning()

      await db.insert(userPlants).values({
        plantId: plant_id,
        userId: result[0].id,
        role: role === 'manager' ? 'manager' : 'student',
      })

      return reply.status(201).send({ userId: result[0].id })
    },
  )
}
