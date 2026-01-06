import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../../_erros/exams-question-not-found-error.ts'
import { GenericEditingError } from '../../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { EditExamQuestionUseCase } from '../../use-cases/edit-exam-question.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const EditQuestions: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examSlug/questions/:questionId/questions',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['questions'],
        summary: 'Edit questions',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examSlug: z.string(),
          questionId: z.uuid(),
        }),
        body: z.object({
          title: z.string(),
        }),
        response: {
          200: z.object({
            questionId: z.uuid(),
            title: z.string(),
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
      const user = getAuthenticatedUser(request)
      const { title } = request.body
      const { journeySlug, moduleSlug, examSlug, questionId } = request.params

      try {
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const examsRepo = new DrizzleExamsRepository()
        const examQuestion = new DrizzleExamQuestionsRepository()
        const sut = new EditExamQuestionUseCase(
          journeysRepo,
          modulesRepo,
          examsRepo,
          examQuestion,
        )

        const { questionEdited } = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          examSlug,
          questionId,
          title,
        })

        reply
          .status(200)
          .send({ questionId: questionEdited.id, title: questionEdited.title })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof ExamsNotFoundError ||
          err instanceof ExamsQuestionNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        if (err instanceof GenericEditingError) {
          reply.status(500).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
