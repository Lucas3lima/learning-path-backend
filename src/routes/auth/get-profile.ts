import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import {
  plantRoleValues,
  userRoleValues,
  users,
} from '../../database/schema.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../hooks/check-request-jwt.ts'
import { requireFullSession } from '../hooks/requireFullSession.ts'

export const getProfileRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/profile',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['auth'],
        summary: 'Get profile',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            user: z.object({
              id: z.uuid(),
              name: z.string().nullable(),
              email: z.email(),
              registration_number: z.string(),
              role: z.enum(userRoleValues),
              plantRole: z.enum(plantRoleValues),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const result = getAuthenticatedUser(request)

      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          registration_number: users.registration_number,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, result.sub))

      if (user.length === 0) {
        throw new Error('User not found!')
      }

      return reply.send({
        user: {
          ...user[0],
          plantRole: result.plantRole ?? 'student',
        },
      })
    },
  )
}
