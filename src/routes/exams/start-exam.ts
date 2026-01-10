import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamAlreadyCompletedError } from '../../_erros/exam-already-completed-error.ts'
import { ExamLockedError } from '../../_erros/exam-locked-error.ts'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { LessonLockedError } from '../../_erros/lesson-locked-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamAnswersRepository } from '../../repositories/drizzle/drizzle-exam-answers-repository.ts'
import { DrizzleExamAttemptsRepository } from '../../repositories/drizzle/drizzle-exam-attempts-repository.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonProgressRepository } from '../../repositories/drizzle/drizzle-lesson-progress-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { StartExamUseCase } from '../../use-cases/start-exam.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const startExam: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examId/start',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['exams'],
        summary: 'Start exam',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examId: z.uuid(),
        }),
        response: {
        201: z.object({
            attemptId: z.uuid(),
            exam: z.object({
                id: z.uuid(),
                title: z.string(),
                }),
            questions: z.array(
                z.object({
                    id: z.uuid(),
                    title: z.string(),
                    order: z.number(),
                    answers: z.array(
                    z.object({
                        id: z.uuid(),
                        title: z.string(),
                        order: z.number(),
                    }),
                    ),
                }),
            ),
        }),
        400: z.object({
            message: z.string(),
        }),
        403: z.object({
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
      const { journeySlug, moduleSlug, examId } = request.params

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const examsRepository = new DrizzleExamsRepository()
        const moduleContentsRepository = new DrizzleModuleContentsRepository()
        const examQuestionsRepository = new DrizzleExamQuestionsRepository()
        const examAnswersRepository = new DrizzleExamAnswersRepository()
        const lessonProgressRepository = new DrizzleLessonProgressRepository()
        const examAttemptsRepository = new DrizzleExamAttemptsRepository()
        const sut = new StartExamUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
          moduleContentsRepository,
          examQuestionsRepository,
          examAnswersRepository,
          lessonProgressRepository,
          examAttemptsRepository,
        )

        const { attemptId, exam, questions } = await sut.execute({
          moduleSlug,
          journeySlug,
          plantId: user.plantId,
          examId,
          userId: user.sub,
        })

        reply.status(201).send({
            attemptId,
            exam,
            questions,
        })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (
          err instanceof ExamLockedError ||
          err instanceof LessonLockedError
        ) {
          reply.status(403).send({ message: err.message })
        }

        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof ExamsNotFoundError ||
          err instanceof ModulesNotFoundError
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
