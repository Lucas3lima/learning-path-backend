import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { InvalidCredentialsError } from '../../_erros/invalid-credentials-error.ts'
import { PlantAccessDeniedError } from '../../_erros/plant-access-denied-error.ts'
import { DrizzleUserPlantsRepository } from '../../repositories/drizzle/drizzle-userPlants-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { SelectPlantUseCase } from '../../use-cases/select-plants.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'

export const selectPlantRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sessions/select-plant',
    {
      preHandler: [checkRequestJWT],
      schema: {
        tags: ['auth'],
        summary: 'Select plant',
        body: z.object({
          plantId: z.uuid(),
        }),
        response: {
          204: z.null(),
          400: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { plantId } = request.body
      const { sub: userId } = getAuthenticatedUser(request)

      try {
        const usersRepository = new DrizzleUsersRepository()
        const userPlantsRepository = new DrizzleUserPlantsRepository()

        const sut = new SelectPlantUseCase(
          usersRepository,
          userPlantsRepository,
        )

        const { user, linkedPlants } = await sut.execute({
          plantId,
          userId,
        })

        const token = await reply.jwtSign(
          {
            sub: userId,
            role: user.role,
            plantRole: linkedPlants.role,
            plantId: linkedPlants.plantId,
          },
          {
            sign: { expiresIn: '2d' },
          },
        )

        reply.setCookie('token', token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 2, // 2 dias
        })

        return reply.status(204).send()
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.status(400).send({ message: err.message })
        }

        if (err instanceof PlantAccessDeniedError) {
          return reply.status(403).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
