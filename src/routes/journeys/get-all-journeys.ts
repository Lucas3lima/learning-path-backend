import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleJourneySectorsRepository } from '../../repositories/drizzle/drizzle-journeys-sectors-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { GetAllJourneysUseCase } from '../../use-cases/get-all-journeys.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const getAllJourneysRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/journeys',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['journeys'],
        summary: 'Get all journeys',
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
              level: z.string(),
              thumbnail_url: z.string().nullable(),
              visible: z.boolean(),

              responsible: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
              }),

              sectors: z.array(
                z
                  .object({
                    id: z.string(),
                    name: z.string(),
                  })
                  .nullable(),
              ),

              totalHours: z.number(),
              totalModules: z.number(),
            }),
          ),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request)

      try {
        const usersRepository = new DrizzleUsersRepository()
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const journeysSectorsRepository = new DrizzleJourneySectorsRepository()
        const sut = new GetAllJourneysUseCase(
          usersRepository,
          journeysRepository,
          modulesRepository,
          journeysSectorsRepository,
        )
        const journeysResponse = await sut.execute({
          plantId: user.plantId,
        })
        return reply.status(200).send(journeysResponse)
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }
      }
    },
  )
}
