import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenericEditingError } from '../../_erros/generic-editing-error.ts'
import { JourneysAlreadyExistsError } from '../../_erros/journeys-already-exists-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { trainingLevelValues } from '../../database/schema.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { EditJourneysUseCase } from '../../use-cases/edit-journeys.ts'
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

const optionalBooleanOrEmptyToUndefined = () =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined
      if (val === true || val === false) return val
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    })

export const editJourneys: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:id',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['journeys'],
        summary: 'Edit journeys',
        params: z.object({
          id: z.uuid(),
        }),
        body: z.object({
          title: optionalStringOrEmptyToUndefined(),
          description: optionalStringOrEmptyToUndefined(),
          level: z.enum(trainingLevelValues).optional(),
          thumbnail_url: optionalStringOrEmptyToUndefined(),
          visible: optionalBooleanOrEmptyToUndefined(),
        }),
        response: {
          200: z.object({
            journeyId: z.uuid(),
          }),
          400: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { title, description, level, thumbnail_url, visible } = request.body
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const sut = new EditJourneysUseCase(journeysRepository)

        const { journey } = await sut.execute({
          id,
          title,
          description,
          level,
          thumbnail_url,
          plantId: user.plantId,
          visible,
        })

        reply.status(200).send({ journeyId: journey.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof GenericEditingError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof JourneysAlreadyExistsError) {
          reply.status(409).send({ message: err.message })
        }

        throw err
      }
    },
  )
}
