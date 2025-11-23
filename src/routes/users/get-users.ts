import { and, asc, ilike, type SQL } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { userRoleValues, users } from '../../database/schema.ts'

export const getUsersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        summary: 'Get all users',
        querystring: z.object({
          search: z.string().optional(),
          orderBy: z
            .enum(['name', 'registration_number'])
            .optional()
            .default('name'),
          page: z.coerce.number().optional().default(1),
        }),
        response: {
          200: z.object({
            users: z.array(
              z.object({
                name: z.string().nullable(),
                email: z.email(),
                registration_number: z.string(),
                role: z.enum(userRoleValues),
                created_at: z.date(),
              }),
            ),
            total: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { search, orderBy, page } = request.query

      const conditions: SQL[] = []

      if (search) {
        conditions.push(ilike(users.registration_number, `%${search}%`))
      }

      const [result, total] = await Promise.all([
        db
          .select({
            name: users.name,
            email: users.email,
            registration_number: users.registration_number,
            role: users.role,
            created_at: users.created_at,
          })
          .from(users)
          .where(and(...conditions))
          .orderBy(asc(users[orderBy]))
          .offset((page - 1) * 2)
          .limit(20),

        db.$count(users, and(...conditions)),
      ])

      return reply.send({ users: result, total })
    },
  )
}
