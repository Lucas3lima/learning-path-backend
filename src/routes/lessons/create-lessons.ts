import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { and, eq, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

import { db } from '../../database/client.ts'
import { journeys, lessons, modules, plants } from '../../database/schema.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { createSlug } from '../../utils/create-slug.ts'
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

      if (!user.plantId) {
        return reply.status(400).send({
          message: 'É necessário selecionar a planta antes de criar aulas.',
        })
      }

      /** -------------------- Buscar planta do usuário -------------------- */
      const plant = await db
        .select()
        .from(plants)
        .where(eq(plants.id, user.plantId))
        .limit(1)

      if (plant.length === 0) {
        return reply.status(404).send({ message: 'Planta não encontrada.' })
      }

      /** -------------------- Buscar Journey e Módulo -------------------- */
      const journey = await db
        .select()
        .from(journeys)
        .where(eq(journeys.slug, journeySlug))
        .limit(1)

      if (journey.length === 0) {
        return reply.status(404).send({ message: 'Jornada não encontrada.' })
      }

      const moduleData = await db
        .select()
        .from(modules)
        .where(eq(modules.slug, moduleSlug))
        .limit(1)

      if (moduleData.length === 0) {
        return reply.status(404).send({ message: 'Módulo não encontrado.' })
      }

      /** -------------------- Configurar diretório do arquivo -------------------- */
      const uploadDir = path.resolve(
        'uploads',
        plant[0].slug,
        journeySlug,
        moduleSlug,
      )
      fs.mkdirSync(uploadDir, { recursive: true })

      /** -------------------- Processar multipart (texto + arquivo) -------------------- */
      let title = ''
      let content = ''
      let video_url: string | undefined
      let pdf_url: string | null = null

      const parts = request.parts()

      for await (const part of parts) {
        // arquivo
        if (part.type === 'file') {
          // Garantir apenas 1 arquivo
          if (pdf_url !== null) {
            return reply.status(400).send({
              message: 'Só é permitido enviar 1 PDF por aula.',
            })
          }

          // Validar tipo
          if (part.mimetype !== 'application/pdf') {
            return reply.status(400).send({
              message: 'Arquivo inválido — apenas PDF é permitido.',
            })
          }

          // Renomear arquivo para evitar conflitos
          const finalName = `${randomUUID()}.pdf`
          const filePath = path.join(uploadDir, finalName)
          const writeStream = fs.createWriteStream(filePath)

          await pipeline(part.file, writeStream)

          pdf_url = `/uploads/${plant[0].slug}/${journeySlug}/${moduleSlug}/${finalName}`
        }

        // campo texto
        else if (typeof part.value === 'string') {
          if (part.fieldname === 'title') title = part.value.trim()
          if (part.fieldname === 'content') content = part.value.trim()
          if (part.fieldname === 'video_url') video_url = part.value.trim()
        }
      }

      /** -------------------- Validações de negócio -------------------- */

      // campos obrigatórios
      if (!title)
        return reply.status(400).send({ message: 'Título é obrigatório.' })
      if (!content)
        return reply.status(400).send({ message: 'Conteúdo é obrigatório.' })

      // AO MENOS 1 entre pdf ou video
      if ((!pdf_url || pdf_url === null) && (!video_url || video_url === '')) {
        return reply.status(400).send({
          message:
            'É necessário enviar um arquivo PDF ou um link de vídeo (pelo menos um dos dois).',
        })
      }

      // gerar slug e garantir unicidade no mesmo módulo
      const slug = createSlug(title)

      const existing = await db
        .select()
        .from(lessons)
        .where(
          and(eq(lessons.moduleId, moduleData[0].id), eq(lessons.slug, slug)),
        )
        .limit(1)

      if (existing.length > 0) {
        return reply
          .status(409)
          .send({ message: 'Já existe uma aula com esse título neste módulo.' })
      }

      /** -------------------- Calcular order -------------------- */
      const [{ nextOrder }] = await db
        .select({
          nextOrder: sql<number>`COALESCE(MAX(${lessons.order}) + 1, 1)`,
        })
        .from(lessons)
        .where(eq(lessons.moduleId, moduleData[0].id))

      /** -------------------- Criar registro no banco (tratando possíveis erros) -------------------- */
      try {
        const [createdLesson] = await db
          .insert(lessons)
          .values({
            title,
            slug,
            order: nextOrder,
            content,
            video_url: video_url ?? null,
            pdf_url,
            moduleId: moduleData[0].id,
          })
          .returning()

        return reply.status(201).send({
          lessonId: createdLesson.id,
        })
      } catch (err: any) {
        // Se por algum motivo a constraint de unique do DB falhar ainda
        // (por concorrência), devolvemos 409 com mensagem amigável.
        // Postgres UNIQUE_VIOLATION geralmente tem code '23505'.
        const pgCode = err?.code ?? err?.pg?.code
        if (pgCode === '23505') {
          return reply
            .status(409)
            .send({ message: 'Conflito: slug já existe neste módulo.' })
        }

        // Log do erro no servidor e retorna 500 genérico
        request.log.error(err)
        return reply.status(500).send({ message: 'Erro ao criar a lesson.' })
      }
    },
  )
}
