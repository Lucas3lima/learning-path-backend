import { and, eq, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { journeys, modules } from '../../database/schema.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { createSlug } from '../../utils/create-slug.ts'
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
        },
      },
    },
    async (request, reply) => {
      const { title, description, hour } = request.body
      const { journeySlug } = request.params
      const user = getAuthenticatedUser(request)

      if (!user.plantId) {
        return reply.status(400).send({
          message: 'É necessário selecionar a planta.',
        })
      }
      const journey = await db
        .select()
        .from(journeys)
        .where(
          and(
            eq(journeys.slug, journeySlug),
            eq(journeys.plantId, user.plantId),
          ),
        )

      if (journey.length === 0) {
        return reply.status(400).send({
          message: 'Trilha não encontrada.',
        })
      }
      const slug = createSlug(title)

      const existingModules = await db
        .select()
        .from(modules)
        .where(
          and(eq(modules.slug, slug), eq(modules.journeyId, journey[0].id)),
        )

      if (existingModules.length > 0) {
        return reply.status(400).send({
          message: 'Já existe um módulo com esse nome nessa trilha.',
        })
      }

      const [{ nextOrder }] = await db
        .select({
          nextOrder: sql<number>`COALESCE(MAX(${modules.order}) + 1, 1)`,
        })
        .from(modules)
        .where(eq(modules.journeyId, journey[0].id))

      const result = await db
        .insert(modules)
        .values({
          title,
          slug,
          description,
          hour,
          order: nextOrder,
          journeyId: journey[0].id,
        })
        .returning()

      reply.status(201).send({ moduleId: result[0].id })
    },
  )
}
