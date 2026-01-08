import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { JourneysNotFoundError } from '../../_erros/journeys-not-found-error.ts'
import { LessonAlreadyCompletedError } from '../../_erros/lesson-already-completed-error.ts'
import { LessonLockedError } from '../../_erros/lesson-locked-error.ts'
import { LessonsNotFoundError } from '../../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonProgressRepository } from '../../repositories/drizzle/drizzle-lesson-progress-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { CreateLessonProgresssUseCase } from '../../use-cases/create-lesson-progress.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createLessonProgress: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/lessons/:lessonId/progress',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['progress'],
        summary: 'Create lesson progress',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          lessonId: z.uuid(),
        }),
        response: {
          201: z.object({
            progress: z.boolean(),
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
      const { journeySlug, moduleSlug, lessonId } = request.params

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const lessonRepository = new DrizzleLessonsRepository()
        const moduleContentsRepository = new DrizzleModuleContentsRepository()
        const lessonProgressRepository = new DrizzleLessonProgressRepository()
        const sut = new CreateLessonProgresssUseCase(
          journeysRepository,
          modulesRepository,
          lessonRepository,
          moduleContentsRepository,
          lessonProgressRepository,
        )

        const { progress } = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
          lessonId,
          userId: user.sub,
        })

        reply.status(201).send({ progress: progress.completed })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (
          err instanceof JourneysNotFoundError ||
          err instanceof ModulesNotFoundError ||
          err instanceof LessonsNotFoundError ||
          err instanceof LessonAlreadyCompletedError ||
          err instanceof LessonLockedError
        ) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
