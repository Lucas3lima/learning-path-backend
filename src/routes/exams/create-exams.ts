import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ExamsAlreadyExistsError } from '../../_erros/exams-already-exists-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleExamsRepository } from '../../repositories/drizzle/drizzle-exams-repository.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModuleContentsRepository } from '../../repositories/drizzle/drizzle-module-contents-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { CreateExamsUseCase } from '../../use-cases/create-exams.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createExams: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/exams',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['exams'],
        summary: 'Create exams',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
        }),
        body: z.object({
          title: z.string(),
          description: z.string(),
        }),
        response: {
          201: z.object({
            examId: z.uuid(),
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
      const { title, description } = request.body
      const { journeySlug, moduleSlug } = request.params

      try {
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const moduleContents = new DrizzleModuleContentsRepository()
        const examsRepo = new DrizzleExamsRepository()
        const sut = new CreateExamsUseCase(
          journeysRepo,
          modulesRepo,
          examsRepo,
          moduleContents,
        )

        const { exam } = await sut.execute({
          moduleSlug,
          journeySlug,
          title,
          description,
          plantId: user.plantId,
        })

        reply.status(201).send({ examId: exam.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof NotFoundError) {
          reply.status(404).send({ message: err.message })
        }

        if (err instanceof ExamsAlreadyExistsError) {
          reply.status(409).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
