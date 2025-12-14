import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenericDeletingError } from '../../_erros/generic-deleting-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DiskStorageProvider } from '../../repositories/disk-storage/disk-storage-provider.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DeleteLessonsUseCase } from '../../use-cases/delete-lessons.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const deleteLessons: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/journeys/:journeySlug/:moduleSlug/:id',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['lessons'],
        summary: 'Delete lessons',
        params: z.object({
          id: z.uuid(),
          journeySlug: z.string(),
          moduleSlug: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
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
      const { id, journeySlug, moduleSlug } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const lessonsRepository = new DrizzleLessonsRepository()
        const storageProvider = new DiskStorageProvider()
        const sut = new DeleteLessonsUseCase(
          journeysRepository,
          modulesRepository,
          lessonsRepository,
          storageProvider,
        )

        const { deleted } = await sut.execute({
          id,
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
        })

        reply.status(200).send({ success: deleted })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof GenericDeletingError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof NotFoundError) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
