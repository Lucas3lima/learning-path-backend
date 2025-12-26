import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsAlreadyExistsError } from '../../_erros/exams-already-exists-error.ts'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { GenericEditingError } from '../../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { EditExamsUseCase } from '../../use-cases/edit-exams.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

const optionalStringOrEmptyToUndefined = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val))

export const editExams: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examId',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['exams'],
        summary: 'Edit exams',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examId: z.uuid(),
        }),
        body: z.object({
          title: optionalStringOrEmptyToUndefined(),
          description: optionalStringOrEmptyToUndefined(),
        }),
        response: {
          200: z.object({
            examId: z.uuid(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title, description } = request.body
      const { journeySlug, moduleSlug, examId } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const examsRepository = new DrizzleExamsRepository()
        const sut = new EditExamsUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
        )

        const { exam } = await sut.execute({
          id: examId,
          journeySlug,
          moduleSlug,
          plantId: user.plantId,
          title,
          description,
        })

        reply.status(200).send({ examId: exam.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }
        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof ExamsNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        if (err instanceof ExamsAlreadyExistsError) {
          reply.status(409).send({ message: err.message })
        }

        if (err instanceof GenericEditingError) {
          reply.status(500).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
