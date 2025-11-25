import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

import { db } from '../../database/client.ts'
import {
  journey_sectors,
  journeys,
  modules,
  sectors,
  users,
} from '../../database/schema.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../hooks/check-request-jwt.ts'
import { requireFullSession } from '../hooks/requireFullSession.ts'

export const getJourneyOverviewRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/journeys/:slug/overview',
    {
      preHandler: [checkRequestJWT, requireFullSession],
      schema: {
        tags: ['journeys'],
        summary: 'Get journey overview',
        params: z.object({
          slug: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            title: z.string(),
            description: z.string().nullable(),
            level: z.string(),
            thumbnail_url: z.string().nullable(),

            responsible: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string(),
            }),

            sectors: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
              }).nullable(),
            ),

            modules: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                order: z.number(),
                slug: z.string(),
                hour: z.number(),
                description: z.string().nullable(),
              }),
            ),

            totalHours: z.number(),
            totalModules: z.number(),
          }),
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
      const { slug } = request.params
      const user = getAuthenticatedUser(request)

      if (!user.plantId) {
        return reply.status(400).send({
          message: 'É necessário selecionar a planta.',
        })
      }

      // 1️⃣ Buscar a Journey
      const journeyResult = await db
        .select()
        .from(journeys)
        .where(and(eq(journeys.slug, slug), eq(journeys.plantId, user.plantId)))

      if (journeyResult.length === 0) {
        return reply.status(404).send({
          message: 'Trilha não encontrada.',
        })
      }

      const journey = journeyResult[0]

      // 2️⃣ Buscar responsável
      const responsible = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, journey.responsibleId))
        .limit(1)

      // 3️⃣ Buscar módulos ordenados
      const journeyModules = await db
        .select({
          id: modules.id,
          title: modules.title,
          slug: modules.slug,
          order: modules.order,
          hour: modules.hour,
          description: modules.description,
        })
        .from(modules)
        .where(eq(modules.journeyId, journey.id))
        .orderBy(modules.order)

      // 4️⃣ Buscar setores vinculados
      const journeySectorsResult = await db
        .select({
          id: sectors.id,
          name: sectors.name,
        })
        .from(journey_sectors)
        .innerJoin(sectors, eq(sectors.id, journey_sectors.sectorId))
        .where(eq(journey_sectors.journeyId, journey.id))

      // 5️⃣ Calcular métricas
      const totalHours = journeyModules.reduce((acc, m) => acc + m.hour, 0)
      const totalModules = journeyModules.length

      return reply.status(200).send({
        id: journey.id,
        title: journey.title,
        description: journey.description,
        level: journey.level,
        thumbnail_url: journey.thumbnail_url,

        responsible: responsible[0],

        sectors: journeySectorsResult.map((s) => ({
          id: s.id,
          name: s.name,
        })),

        modules: journeyModules,

        totalHours,
        totalModules,
      })
    },
  )
}
