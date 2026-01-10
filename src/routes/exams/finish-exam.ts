import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DuplicateExamQuestionAnswerError } from '../../_erros/duplicate-exam-question-answer-error.ts'
import { ExamAlreadyCompletedError } from '../../_erros/exam-already-completed-error.ts'
import { ExamNotStartedError } from '../../_erros/exam-not-started-error.ts'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../../_erros/exams-question-not-found-error.ts'
import { IncompleteExamError } from '../../_erros/incomplete-exam-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamAnswersRepository } from '../../repositories/drizzle/drizzle-exam-answers-repository.ts'
import { DrizzleExamAttemptsRepository } from '../../repositories/drizzle/drizzle-exam-attempts-repository.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { FinishExamUseCase } from '../../use-cases/finish-exam.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const finishExam: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examId/finish',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['exams'],
        summary: 'Finish exam',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examId: z.uuid(),
        }),
        body: z.object({
          answers: z.array(
            z.object({
              questionId: z.uuid(),
              answerId: z.uuid(),
            }),
          ),
        }),

        response: {
          200: z.union([
            z.object({
              score: z.number(),
              approved: z.literal(false),
              totalQuestions: z.number(),
              correctAnswers: z.number(),
            }),
            z.object({
              score: z.number(),
              approved: z.literal(true),
              totalQuestions: z.number(),
              correctAnswers: z.number(),
              results: z.array(
                z.object({
                  questionId: z.uuid(),
                  selectedAnswerId: z.uuid(),
                  correctAnswerId: z.uuid(),
                  isCorrect: z.boolean(),
                }),
              ),
            }),
          ]),
          400: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUser(request)
      const { answers } = request.body
      const { journeySlug, moduleSlug, examId } = request.params

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const examsRepository = new DrizzleExamsRepository()
        const moduleContentsRepository = new DrizzleModuleContentsRepository()
        const examQuestionsRepository = new DrizzleExamQuestionsRepository()
        const examAnswersRepository = new DrizzleExamAnswersRepository()
        const examAttemptsRepository = new DrizzleExamAttemptsRepository()
        const sut = new FinishExamUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
          moduleContentsRepository,
          examQuestionsRepository,
          examAnswersRepository,
          examAttemptsRepository,
        )

        const result = await sut.execute({
          moduleSlug,
          journeySlug,
          plantId: user.plantId,
          examId,
          userId: user.sub,
          answers,
        })

        reply.status(200).send(result)
      } catch (err) {
        if (
          err instanceof PlantNotSelectedError ||
          err instanceof DuplicateExamQuestionAnswerError ||
          err instanceof IncompleteExamError
        ) {
          return reply.status(400).send({ message: err.message })
        }

        if (err instanceof ExamNotStartedError) {
          reply.status(403).send({ message: err.message })
        }

        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof ExamsNotFoundError ||
          err instanceof ExamsQuestionNotFoundError
        ) {
          reply.status(404).send({ message: err.message })
        }

        if (err instanceof ExamAlreadyCompletedError) {
          reply.status(409).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
