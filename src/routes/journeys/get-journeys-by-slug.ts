import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { journeys } from '../../database/schema.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../hooks/check-request-jwt.ts'
import { requireFullSession } from '../hooks/requireFullSession.ts'
export const getJourneysBySlug: FastifyPluginAsyncZod = async (app) => {
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
        // response: {
        //   201: z.object({
        //     journeyId: z.uuid(),
        //   }),
        //   400: z.object({
        //     message: z.string()
        //   })
        // },
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

      const result = await db
        .select()
        .from(journeys)
        .where(and(eq(journeys.slug, slug), eq(journeys.plantId, user.plantId)))

      if (result.length === 0) {
        return reply.status(404).send({
          message: 'Trilha não encontrada.',
        })
      }

      reply.status(201).send({ journeyId: result[0].id })
    },
  )
}
