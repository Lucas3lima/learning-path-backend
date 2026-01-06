import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsNotFoundError } from '../../_erros/exams-not-found-error.ts'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamAnswersRepository } from '../../repositories/drizzle/drizzle-exam-answers-repository.ts'
import { DrizzleExamQuestionsRepository } from '../../repositories/drizzle/drizzle-exam-questions-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { GetExamsContentUseCase } from '../../use-cases/get-exams-content.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const GetExamContentsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/journeys/:journeySlug/modules/:moduleSlug/exams/:examSlug/edit',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['exams'],
        summary: 'List all contents in exam',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          examSlug: z.string(),
        }),
        response: {
          200: z.object({
            exam: z.object({
              id: z.string(),
              title: z.string(),
              slug: z.string(),
            }),
            questions: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                order: z.number(),
                answers: z.array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    order: z.number(),
                    isCorrect: z.boolean(),
                  }),
                ),
              }),
            ),
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
      const user = getAuthenticatedUser(request)
      const { journeySlug, moduleSlug, examSlug } = request.params

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const examsRepository = new DrizzleExamsRepository()
        const examQuestionsRepository = new DrizzleExamQuestionsRepository()
        const examAnswersRepository = new DrizzleExamAnswersRepository()
        const sut = new GetExamsContentUseCase(
          journeysRepository,
          modulesRepository,
          examsRepository,
          examQuestionsRepository,
          examAnswersRepository,
        )
        const examResponse = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          examSlug,
        })
        return reply.status(200).send(examResponse)
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
      }
    },
  )
}
