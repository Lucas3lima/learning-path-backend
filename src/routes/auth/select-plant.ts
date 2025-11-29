import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { userPlants, users } from '../../database/schema.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'

export const selectPlantRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sessions/select-plant',
    {
      preHandler: [checkRequestJWT],
      schema: {
        tags: ['auth'],
        summary: 'Select-plant',
        body: z.object({
          plantId: z.uuid(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
          403: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { plantId } = request.body
      const result = getAuthenticatedUser(request)

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, result.sub))
        .limit(1)

      if (user.length === 0) {
        return reply.status(400).send({ message: 'Credenciais inválidas.' })
      }

      const linkedPlants = await db
        .select({
          id: userPlants.plantId,
          role: userPlants.role,
        })
        .from(userPlants)
        .where(
          and(
            eq(userPlants.plantId, plantId),
            eq(userPlants.userId, result.sub),
          ),
        )

      if (linkedPlants.length === 0) {
        return reply
          .status(403)
          .send({ message: 'Você não tem permissão para acessar esta planta.' })
      }

      if (linkedPlants.length === 1) {
        const token = await reply.jwtSign(
          {
            sub: result.sub,
            role: user[0].role,
            plantRole: linkedPlants[0].role,
            plantId: linkedPlants[0].id,
          },
          {
            sign: {
              expiresIn: '1d',
            },
          },
        )

        return reply.status(201).send({ token })
      }
    },
  )
}
