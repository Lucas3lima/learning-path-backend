import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { GenericDeletingError } from '../../_erros/generic-deleting-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DeleteExamsUseCase } from '../../use-cases/delete-exams.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const deleteExams: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/journeys/:journeySlug/:moduleSlug/exams/:id',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['exams'],
        summary: 'Delete exams',
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
          500: z.object({
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
        const examsRepository = new DrizzleExamsRepository()
        const sut = new DeleteExamsUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
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
          reply.status(500).send({ message: err.message })
        }

        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof ExamsNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
