import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ModulesAlreadyExistsError } from '../../_erros/modules-already-exists-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { CreateModuleUseCase } from '../../use-cases/create-module.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createModules: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['modules'],
        summary: 'Create modules',
        params: z.object({
          journeySlug: z.string(),
        }),
        body: z.object({
          title: z.string().min(4),
          description: z.string(),
          hour: z.number().min(1),
        }),
        response: {
          201: z.object({
            moduleId: z.uuid(),
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
      const { title, description, hour } = request.body
      const { journeySlug } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const sut = new CreateModuleUseCase(
          journeysRepository,
          modulesRepository,
        )

        const { module } = await sut.execute({
          title,
          description,
          hour,
          journeySlug,
          plantId: user.plantId,
        })

        reply.status(201).send({ moduleId: module.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof ModulesAlreadyExistsError) {
          reply.status(409).send({ message: err.message })
        }

        if (err instanceof NotFoundError) {
          reply.status(404).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
