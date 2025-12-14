import { PassThrough } from 'node:stream'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { InvalidFileTypeError } from '../../_erros/invalid-file-type-error.ts'
import { LessonsAlreadyExistsError } from '../../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../../_erros/plant-not-selected-error.ts'
import { DiskStorageProvider } from '../../repositories/disk-storage/disk-storage-provider.ts'
import { DrizzleJourneysRepository } from '../../repositories/drizzle/drizzle-journeys-repository.ts'
import { DrizzleLessonsRepository } from '../../repositories/drizzle/drizzle-lessons-repository.ts'
import { DrizzleModulesRepository } from '../../repositories/drizzle/drizzle-modules-repository.ts'
import { DrizzlePlantsRepository } from '../../repositories/drizzle/drizzle-plants-repository.ts'
import { EditLessonsPDFUseCase } from '../../use-cases/edit-lessons-pdf.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const editLessonsPDFs: FastifyPluginAsyncZod = async (app) => {
  app.put(
    '/journeys/:journeySlug/modules/:moduleSlug/:lessonId/pdf',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['lessons'],
        summary: 'Edit lessons pdfs',
        consumes: ['multipart/form-data'],
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
          lessonId: z.uuid(),
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
      const user = getAuthenticatedUser(request)
      const { journeySlug, moduleSlug, lessonId } = request.params

      const pdf_url: string | null = null

      const parts = request.parts()

      let file: {
        stream: NodeJS.ReadableStream
        mimetype: string
      } | null = null

      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.mimetype !== 'application/pdf') {
            return reply.status(400).send({
              message: 'Arquivo inválido — apenas PDF é permitido.',
            })
          }

          const pass = new PassThrough()

          process.nextTick(async () => {
            for await (const chunk of part.file) {
              pass.write(chunk)
            }
            pass.end()
          })

          file = {
            stream: pass,
            mimetype: part.mimetype,
          }
        }
      }

      if (!file) {
        return reply.status(400).send({
          message: 'PDF file is required.',
        })
      }

      try {
        const plantsRepo = new DrizzlePlantsRepository()
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const lessonsRepo = new DrizzleLessonsRepository()
        const storage = new DiskStorageProvider()

        const sut = new EditLessonsPDFUseCase(
          plantsRepo,
          journeysRepo,
          modulesRepo,
          lessonsRepo,
          storage,
        )

        const { lesson } = await sut.execute({
          id: lessonId,
          journeySlug,
          moduleSlug,
          plantId: user.plantId,
          file,
        })

        return reply.status(200).send({
          lessonId: lesson.id,
        })
      } catch (err) {
        if (err instanceof PlantNotSelectedError)
          return reply.status(400).send({ message: err.message })

        if (err instanceof PlantNotFoundError)
          return reply.status(404).send({ message: err.message })

        if (err instanceof NotFoundError)
          return reply.status(404).send({ message: err.message })

        if (err instanceof LessonsAlreadyExistsError)
          return reply.status(409).send({ message: err.message })

        if (err instanceof InvalidFileTypeError)
          return reply.status(400).send({ message: err.message })

        throw err
      }
    },
  )
}
