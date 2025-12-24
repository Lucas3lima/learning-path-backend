import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { ListModuleContentsUseCase } from '../../use-cases/list-module-contents.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const ListModuleLessonsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/journeys/:journeySlug/:moduleSlug',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['modules'],
        summary: 'List all contents in module',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              slug: z.string(),
              order: z.number().nullable(),
              content: z.string().nullable(),
              video_url: z.string().nullable(),
              pdf_url: z.string().nullable(),
            }),
          ),
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
      const { journeySlug, moduleSlug } = request.params

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const lessonsRepository = new DrizzleLessonsRepository()
        const examsRepository = new DrizzleExamsRepository()
        const moduleContentsRepository = new DrizzleModuleContentsRepository()
        const sut = new ListModuleContentsUseCase(
          journeysRepository,
          modulesRepository,
          lessonsRepository,
          examsRepository,
          moduleContentsRepository,
        )
        const lessonsResponse = await sut.execute({
          plantId: user.plantId,
          journeySlug,
          moduleSlug,
        })
        return reply.status(200).send(lessonsResponse)
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }
        if (err instanceof NotFoundError) {
          reply.status(404).send({ message: err.message })
        }
      }
    },
  )
}
