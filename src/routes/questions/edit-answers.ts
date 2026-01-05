import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z, { uuid } from 'zod'
import { ExamAnswersLimitError } from '../../_erros/exam-answers-limit-error.ts'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../../_erros/exams-question-not-found-error.ts'
import { GenericDeletingError } from '../../_erros/generic-deleting-error.ts'
import { InvalidCorrectExamAnswerError } from '../../_erros/invalid-correct-exam-answer-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamAnswersRepository } from '../../repositories/drizzle/drizzle-exam-answers-repository.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { EditExamAnswersUseCase } from '../../use-cases/edit-exam-answers.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const EditAnswers: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examSlug/questions/:questionId/answers',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['questions'],
        summary: 'Edit answers',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examSlug: z.string(),
          questionId: z.uuid(),
        }),
        body: z.object({
          answers: z
            .array(
              z.object({
                title: z.string().trim().min(1, 'Título é obrigatório'),
                isCorrect: z.boolean(),
              }),
            )
            .refine((answers) => answers.length >= 2 && answers.length <= 5, {
              message: 'A pergunta deve ter entre 2 e 5 respostas',
            }),
        }),
        response: {
          200: z.object({
            questionId: z.uuid(),
            answers: z.array(
              z.object({
                id: uuid(),
                title: z.string(),
                isCorrect: z.boolean(),
                order: z.number()
              }),
            )
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
      const { answers } = request.body
      const { journeySlug, moduleSlug, examSlug, questionId } = request.params

      try {
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const examsRepo = new DrizzleExamsRepository()
        const examQuestion = new DrizzleExamQuestionsRepository()
        const examAnswers = new DrizzleExamAnswersRepository()
        const sut = new EditExamAnswersUseCase(
          journeysRepo,
          modulesRepo,
          examsRepo,
          examQuestion,
          examAnswers,
        )

        const { createdAnswers } = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          examSlug,
          questionId,
          answers,
        })

        const response = {
          questionId,
          answers: createdAnswers.map((answer) => ({
            id: answer.id,
            title: answer.title,
            isCorrect: answer.isCorrect,
            order: answer.order,
          })),
        }

        reply.status(200).send(response)
      } catch (err) {
        if (
          err instanceof PlantNotSelectedError ||
          err instanceof ExamAnswersLimitError ||
          err instanceof InvalidCorrectExamAnswerError
        ) {
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

        if (err instanceof GenericDeletingError) {
          reply.status(500).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
