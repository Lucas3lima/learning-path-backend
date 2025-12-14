import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenericDeletingError } from '../../_erros/generic-deleting-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DiskStorageProvider } from '../../repositories/disk-storage/disk-storage-provider.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzlePlantsRepository } from '../../repositories/drizzle/drizzle-plants-repository.ts'
import { DeleteJourneysUseCase } from '../../use-cases/delete-journeys.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const deleteJourneys: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/journeys/:id',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['journeys'],
        summary: 'Delete journeys',
        params: z.object({
          id: z.uuid(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
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
      const { id } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const plantsRepository = new DrizzlePlantsRepository()
        const journeysRepository = new DrizzleJourneysRepository()
        const storageProvider = new DiskStorageProvider()
        const sut = new DeleteJourneysUseCase(
          plantsRepository,
          journeysRepository,
          storageProvider,
        )

        const { deleted } = await sut.execute({
          id,
          plantId: user.plantId,
        })

        reply.status(200).send({ success: deleted })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof GenericDeletingError) {
          reply.status(400).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
