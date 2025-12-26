import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamAnswersLimitError } from '../../_erros/exam-answers-limit-error.ts'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { InvalidCorrectExamAnswerError } from '../../_erros/invalid-correct-exam-answer-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamAnswersRepository } from '../../repositories/drizzle/drizzle-exam-answers-repository.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { CreateQuestionsAndAnswersUseCase } from '../../use-cases/create-questions-and-answers.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createQuestionsAndAnswers: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examId/questions',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['questions'],
        summary: 'Create questions and answers',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examId: z.uuid(),
        }),
        body: z.object({
          title: z.string(),
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
          201: z.object({
            questionId: z.uuid(),
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
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request)
      const { title, answers } = request.body
      const { journeySlug, moduleSlug, examId } = request.params

      try {
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const examsRepo = new DrizzleExamsRepository()
        const examQuestion = new DrizzleExamQuestionsRepository()
        const examAnswers = new DrizzleExamAnswersRepository()
        const sut = new CreateQuestionsAndAnswersUseCase(
          journeysRepo,
          modulesRepo,
          examsRepo,
          examQuestion,
          examAnswers,
        )

        const { question } = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          examId,
          title,
          answers,
        })

        reply.status(201).send({ questionId: question.id })
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
          err instanceof ExamsNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
