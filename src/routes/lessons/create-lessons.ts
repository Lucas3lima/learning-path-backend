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
import { CreateLessonsUseCase } from '../../use-cases/create-lessons.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'

export const createLessons: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys/:journeySlug/modules/:moduleSlug/lessons',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['lessons'],
        summary: 'Create lessons',
        consumes: ['multipart/form-data'],
        params: z.object({
          journeySlug: z.string(),
          moduleSlug: z.string(),
        }),
        response: {
          201: z.object({
            lessonId: z.uuid(),
          }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },

    async (request, reply) => {
      const user = getAuthenticatedUser(request)
      const { journeySlug, moduleSlug } = request.params

      let title = ''
      let content = ''
      let video_url: string | undefined
      const pdf_url: string | null = null

      const parts = request.parts()

      let file:
        | {
            stream: NodeJS.ReadableStream
            mimetype: string
          }
        | undefined

      for await (const part of parts) {
        // ARQUIVO
        if (part.type === 'file') {

          if (file) {
            // 🔥 DRENAR O STREAM
            for await (const _ of part.file) {
              // só consome
            }
            return reply.status(400).send({
              message: 'É permitido enviar apenas 1 arquivo PDF.',
            })
          }

          if (part.mimetype !== 'application/pdf') {
            return reply.status(400).send({
              message: 'Arquivo inválido — apenas PDF é permitido.',
            })
          }

          // Novo stream que será passado para o use-case
          const pass = new PassThrough()

          // Consumir o stream original (OBRIGATÓRIO)
          process.nextTick(async () => {
            for await (const chunk of part.file) {
              pass.write(chunk) // redireciona para o stream novo
            }
            pass.end()
          })

          file = {
            stream: pass, // stream reutilizável
            mimetype: part.mimetype,
          }

          continue
        }

        // CAMPOS TEXTO
        if (typeof part.value === 'string') {
          if (part.fieldname === 'title') title = part.value.trim()
          if (part.fieldname === 'content') content = part.value.trim()
          if (part.fieldname === 'video_url') video_url = part.value.trim()
        }
      }

      // campos obrigatórios
      if (!title)
        return reply.status(400).send({ message: 'Título é obrigatório.' })
      if (!content)
        return reply.status(400).send({ message: 'Conteúdo é obrigatório.' })

      try {
        const plantsRepo = new DrizzlePlantsRepository()
        const journeysRepo = new DrizzleJourneysRepository()
        const modulesRepo = new DrizzleModulesRepository()
        const lessonsRepo = new DrizzleLessonsRepository()
        const storage = new DiskStorageProvider()

        const sut = new CreateLessonsUseCase(
          plantsRepo,
          journeysRepo,
          modulesRepo,
          lessonsRepo,
          storage,
        )

        if (!video_url && !file) {
          return reply.status(400).send({
            message: 'Envie ao menos um PDF ou um link de vídeo.',
          })
        }

        const { lesson } = await sut.execute({
          title,
          content,
          video_url,
          journeySlug,
          moduleSlug,
          plantId: user.plantId,
          file,
        })

        return reply.status(201).send({
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
