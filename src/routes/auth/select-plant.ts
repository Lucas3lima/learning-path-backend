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

      try {
        const usersRepository = new DrizzleUsersRepository()
        const userPlantsRepository = new DrizzleUserPlantsRepository()
        const sut = new SelectPlantUseCase(
          usersRepository,
          userPlantsRepository,
        )

        const { user, linkedPlants } = await sut.execute({
          plantId,
          userId: result.sub,
        })

        const token = await reply.jwtSign(
          {
            sub: result.sub,
            role: user.role,
            plantRole: linkedPlants.role,
            plantId: linkedPlants.plantId,
          },
          {
            sign: {
              expiresIn: '2d',
            },
          },
        )

        return reply.status(201).send({ token })
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
