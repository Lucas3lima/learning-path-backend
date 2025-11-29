import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import {
  journey_sectors,
  journeys,
  trainingLevelValues,
} from '../../database/schema.ts'
import { checkPlantRole } from '../../utils/check-plant-role.ts'
import { createSlug } from '../../utils/create-slug.ts'
import { getAuthenticatedUser } from '../../utils/get-authenticate-user.ts'
import { checkRequestJWT } from '../_hooks/check-request-jwt.ts'
import { requireFullSession } from '../_hooks/requireFullSession.ts'
export const createJourneys: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/journeys',
    {
      preHandler: [
        checkRequestJWT,
        requireFullSession,
        checkPlantRole('manager'),
      ],
      schema: {
        tags: ['journeys'],
        summary: 'Create journeys',
        body: z.object({
          title: z.string(),
          description: z.string(),
          level: z.enum(trainingLevelValues).default('Beginner'),
          sectorsIds: z.array(z.uuid()).min(1),
        }),
        response: {
          201: z.object({
            journeyId: z.uuid(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title, description, level, sectorsIds } = request.body
      const user = getAuthenticatedUser(request)

      const slug = createSlug(title)
      if (!user.plantId) {
        return reply.status(400).send({
          message: 'É necessário selecionar a planta.',
        })
      }
      const existingJourney = await db
        .select()
        .from(journeys)
        .where(and(eq(journeys.slug, slug), eq(journeys.plantId, user.plantId)))

      if (existingJourney.length > 0) {
        return reply.status(400).send({
          message: 'Já existe uma jornada com esse nome para essa planta.',
        })
      }

      const result = await db
        .insert(journeys)
        .values({
          title,
          slug,
          description,
          level,
          responsibleId: user.sub,
          plantId: user.plantId,
        })
        .returning()

      await Promise.all(
        sectorsIds.map(async (sectorId) => {
          const exists = await db
            .select()
            .from(journey_sectors)
            .where(
              and(
                eq(journey_sectors.journeyId, result[0].id),
                eq(journey_sectors.sectorId, sectorId),
              ),
            )

          if (exists.length === 0) {
            await db.insert(journey_sectors).values({
              journeyId: result[0].id,
              sectorId,
            })
          }
        }),
      )

      reply.status(201).send({ journeyId: result[0].id })
    },
  )
}
