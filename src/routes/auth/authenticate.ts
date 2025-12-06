import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { InvalidCredentialsError } from '../../_erros/invalid-credentials-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { DrizzleUserPlantsRepository } from '../../repositories/drizzle/drizzle-userPlants-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { AuthenticateUseCase } from '../../use-cases/authenticate.ts'
import { LinkedPlantsUseCase } from '../../use-cases/linked-plants.ts'

export const authenticateRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with email & password',
        body: z.object({
          email: z.email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
            requiresPlantSelection: z.boolean().optional(),
            plants: z
              .array(
                z.object({
                  id: z.string(), // UUID
                  name: z.string(),
                  role: z.string(),
                }),
              )
              .optional(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      try {
        const usersRepository = new DrizzleUsersRepository()
        const userPlantsRepository = new DrizzleUserPlantsRepository()
        const authenticateUseCase = new AuthenticateUseCase(usersRepository)
        const linkedPlantsUseCase = new LinkedPlantsUseCase(
          userPlantsRepository,
        )

        const { user } = await authenticateUseCase.execute({ email, password })

        const { linkedPlants } = await linkedPlantsUseCase.execute({
          userId: user.id,
        })

        if (linkedPlants.length === 1) {
          const token = await reply.jwtSign(
            {
              sub: user.id,
              role: user.role,
              plantRole: linkedPlants[0].role,
              plantId: linkedPlants[0].id,
            },
            {
              sign: {
                expiresIn: '2d',
              },
            },
          )

          return reply.status(201).send({ token })
        }

        // 5) Se possuir mais de uma planta → retorna lista para o usuário escolher
        const shortToken = await reply.jwtSign(
          {
            sub: user.id,
          },
          { sign: { expiresIn: '2m' } },
        )

        return reply.status(201).send({
          token: shortToken,
          requiresPlantSelection: true,
          plants: linkedPlants,
        })
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.status(400).send({ message: err.message })
        }
        if (err instanceof NotFoundError) {
          return reply.status(400).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
