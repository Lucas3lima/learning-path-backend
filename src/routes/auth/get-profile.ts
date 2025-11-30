import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { db } from '../../database/client.ts'
import {
  plantRoleValues,
  userRoleValues,
  users,
} from '../../database/schema.ts'
import { DrizzleUserPlantsRepository } from '../../repositories/drizzle/drizzle-userPlants-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { GetProfileUseCase } from '../../use-cases/get-profile.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

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
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const result = getAuthenticatedUser(request)

      try {
        const usersRepository = new DrizzleUsersRepository()
        const userPlantsRepository = new DrizzleUserPlantsRepository()
        const getProfileUseCase = new GetProfileUseCase(
          usersRepository,
          userPlantsRepository,
        )

        const user = await getProfileUseCase.execute({
          userId: result.sub,
          plantId: result.plantId ?? '',
        })
        return reply.status(200).send({ user })
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(409).send({ message: err.message })
        }
        throw err
      }
    },
  )
}
