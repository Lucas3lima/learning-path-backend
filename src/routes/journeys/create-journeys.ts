import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { JourneysAlreadyExistsError } from '../../_erros/journeys-already-exists-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { trainingLevelValues } from '../../database/schema.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleJourneySectorsRepository } from '../../repositories/drizzle/drizzle-journeys-sectors-repository.ts'
import { CreateJourneysUseCase } from '../../use-cases/create-journeys.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createJourneys: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['journeys'],
        summary: 'Create journeys',
        body: z.object({
          title: z.string(),
          description: z.string(),
          level: z.enum(trainingLevelValues).default('Beginner'),
          sectorsIds: z.array(z.uuid()).min(1),
        }),
        response: {
          201: z.object({
            journeyId: z.uuid(),
          }),
          400: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title, description, level, sectorsIds } = request.body
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const journeySectorRepository = new DrizzleJourneySectorsRepository()
        const sut = new CreateJourneysUseCase(
          journeysRepository,
          journeySectorRepository,
        )

        const { journey } = await sut.execute({
          title,
          description,
          level,
          sectorsIds,
          responsibleId: user.sub,
          plantId: user.plantId,
        })

        reply.status(201).send({ journeyId: journey.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof JourneysAlreadyExistsError) {
          reply.status(409).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
