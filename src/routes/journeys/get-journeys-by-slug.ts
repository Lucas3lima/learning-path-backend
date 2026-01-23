import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { UsersNotFoundError } from '../../_erros/users-not-found-error.ts'
import { DrizzleExamAttemptsRepository } from '../../repositories/drizzle/drizzle-exam-attempts-repository.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleJourneySectorsRepository } from '../../repositories/drizzle/drizzle-journeys-sectors-repository.ts'
import { DrizzleLessonProgressRepository } from '../../repositories/drizzle/drizzle-lesson-progress-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DrizzleUsersRepository } from '../../repositories/drizzle/drizzle-users-repository.ts'
import { GetJourneyOverviewUseCase } from '../../use-cases/get-journey-overview.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const getJourneyOverviewRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/journeys/:slug/overview',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['journeys'],
        summary: 'Get journey overview',
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            level: z.string(),
            thumbnail_url: z.string().nullable(),

            responsible: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
            }),

            sectors: z.array(
              z
                .object({
                  id: z.string(),
                  name: z.string(),
                })
                .nullable(),
            ),

            modules: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                order: z.number(),
                slug: z.string(),
                hour: z.number(),
                description: z.string().nullable(),
                totalLessons: z.number(),
                totalExams: z.number(),
                totalCompleted: z.number(),
              }),
            ),

            totalHours: z.number(),
            totalModules: z.number(),
            progress: z.number(),
            completed: z.boolean(),
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
      const { slug } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const usersRepository = new DrizzleUsersRepository()
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const journeysSectorsRepository = new DrizzleJourneySectorsRepository()
        const lessonsRepository = new DrizzleLessonsRepository()
        const examsRepository = new DrizzleExamsRepository()
        const moduleContentsRepository = new DrizzleModuleContentsRepository()
        const lessonProgressRepository = new DrizzleLessonProgressRepository()
        const examAttemptsRepository = new DrizzleExamAttemptsRepository()
        const sut = new GetJourneyOverviewUseCase(
          usersRepository,
          journeysRepository,
          modulesRepository,
          journeysSectorsRepository,
          lessonsRepository,
          examsRepository,
          moduleContentsRepository,
          lessonProgressRepository,
          examAttemptsRepository,
        )

        const journey_overview = await sut.execute({
          slug,
          plantId: user.plantId,
          userId: user.sub,
        })

        return reply.status(200).send(journey_overview)
      } catch (err) {
        if (
          err instanceof PlantNotSelectedError ||
          err instanceof UsersNotFoundError
        ) {
          return reply.status(400).send({ message: err.message })
        }

        if (err instanceof JourneysNotFoundError) {
          return reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
