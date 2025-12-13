import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenericEditingError } from '../../_erros/generic-editing-error.ts'
import { ModulesAlreadyExistsError } from '../../_erros/modules-already-exists-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { EditModulesUseCase } from '../../use-cases/edit-modules.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

const optionalStringOrEmptyToUndefined = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val))

const optionalIntOrEmptyToUndefined = () =>
  z.preprocess((val) => {
    // tratar undefined, null, string vazia ou só espaços como undefined
    if (val === undefined || val === null) return undefined
    if (typeof val === 'string' && val.trim() === '') return undefined

    // se for string numérica, converte; se for number, mantém
    if (typeof val === 'string') {
      const n = Number(val)
      return Number.isNaN(n) ? val : n
    }
    return val
  }, z.number().int().optional())

export const createModules: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleId',
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
          moduleId: z.uuid(),
        }),
        body: z.object({
          title: optionalStringOrEmptyToUndefined(),
          description: optionalStringOrEmptyToUndefined(),
          order: optionalIntOrEmptyToUndefined(),
          hour: optionalIntOrEmptyToUndefined(),
        }),
        response: {
          200: z.object({
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
      const { title, description, hour, order } = request.body
      const { journeySlug, moduleId } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const sut = new EditModulesUseCase(
          modulesRepository,
          journeysRepository,
        )

        const { module } = await sut.execute({
          id: moduleId,
          journeySlug,
          plantId: user.plantId,
          title,
          description,
          order,
          hour,
        })

        reply.status(200).send({ moduleId: module.id })
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

        if (err instanceof GenericEditingError) {
          reply.status(400).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
