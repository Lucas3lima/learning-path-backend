import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenericEditingError } from '../../_erros/generic-editing-error.ts'
import { LessonsAlreadyExistsError } from '../../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { EditLessonsUseCase } from '../../use-cases/edit-lessons.ts'
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

export const editLessons: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleSlug/:lessonId',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['lessons'],
        summary: 'Edit lessons inputs',
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          lessonId: z.uuid(),
        }),
        body: z.object({
          title: optionalStringOrEmptyToUndefined(),
          content: optionalStringOrEmptyToUndefined(),
          order: optionalIntOrEmptyToUndefined(),
          video_url: optionalStringOrEmptyToUndefined(),
        }),
        response: {
          200: z.object({
            lessonId: z.uuid(),
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
      const { title, content, video_url, order } = request.body
      const { journeySlug, moduleSlug, lessonId } = request.params
      const user = getAuthenticatedUser(request)

      try {
        const journeysRepository = new DrizzleJourneysRepository()
        const modulesRepository = new DrizzleModulesRepository()
        const lessonsRepository = new DrizzleLessonsRepository()
        const sut = new EditLessonsUseCase(
          modulesRepository,
          journeysRepository,
          lessonsRepository,
        )

        const { lesson } = await sut.execute({
          id: lessonId,
          journeySlug,
          moduleSlug,
          plantId: user.plantId,
          title,
          content,
          order,
          video_url,
        })

        reply.status(200).send({ lessonId: lesson.id })
      } catch (err) {
        if (err instanceof PlantNotSelectedError) {
          reply.status(400).send({ message: err.message })
        }

        if (err instanceof LessonsAlreadyExistsError) {
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
