import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../../_erros/exams-question-not-found-error.ts'
import { GenericDeletingError } from '../../_erros/generic-deleting-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DeleteExamQuestionUseCase } from '../../use-cases/delete-exam-question.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const deleteExamQuestions: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examSlug/questions/:questionId',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['exams'],
        summary: 'Delete quentions',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examSlug: z.string(),
          questionId: z.uuid(),
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
      const { journeySlug, moduleSlug, examSlug, questionId } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const examsRepository = new DrizzleExamsRepository()
        const examQuestionsRepository = new DrizzleExamQuestionsRepository()
        const sut = new DeleteExamQuestionUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
          examQuestionsRepository,
        )

        const { questionDeleted } = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          examSlug,
          questionId,
        })

        reply.status(200).send({ success: questionDeleted })
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
          err instanceof ExamsNotFoundError ||
          err instanceof ExamsQuestionNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
