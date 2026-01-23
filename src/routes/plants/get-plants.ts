import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DrizzlePlantsRepository } from '../../repositories/drizzle/drizzle-plants-repository.ts'
import { GetPlantsUseCase } from '../../use-cases/get-plants.ts'

export const getPlantsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/plants',
    {
      schema: {
        tags: ['plants'],
        summary: 'Get all plants',
        response: {
          200: z.object({
            plants: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      
      const plantsRepository = new DrizzlePlantsRepository()

      const sut = new GetPlantsUseCase(
        plantsRepository,
      )

      const { plants } = await sut.execute()

      reply.status(200).send({ plants: plants})
      
    },
  )
}
