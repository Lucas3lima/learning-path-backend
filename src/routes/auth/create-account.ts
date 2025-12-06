import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UserAlreadyExistsError } from '../../_erros/user-already-exists-error.ts'
import { userRoleValues } from '../../database/schema.ts'
import { DrizzleUserPlantsRepository } from '../../repositories/drizzle/drizzle-userPlants-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { CreateAccountUseCase } from '../../use-cases/create-account.ts'
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
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, registration_number, role, plant_id } =
        request.body

      try {
        const usersRepository = new DrizzleUsersRepository()
        const userPlantsRepository = new DrizzleUserPlantsRepository()
        const createAccountUseCase = new CreateAccountUseCase(
          usersRepository,
          userPlantsRepository,
        )

        const { user } = await createAccountUseCase.execute({
          name,
          email,
          password,
          registration_number,
          role,
          plant_id,
        })

        return reply.status(201).send({ userId: user.id })
      } catch (err) {
        if (err instanceof UserAlreadyExistsError) {
          return reply.status(409).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
