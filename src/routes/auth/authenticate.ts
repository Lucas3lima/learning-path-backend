import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { db } from '../../database/client.ts'
import { plants, userPlants, users } from '../../database/schema.ts'

export const authenticateRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with email & password',
        body: z.object({
          email: z.email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
            requiresPlantSelection: z.boolean().optional(),
            plants: z
              .array(
                z.object({
                  id: z.string(), // UUID
                  name: z.string(),
                  role: z.string(),
                }),
              )
              .optional(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      // 1) Busca usuário
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (user.length === 0) {
        return reply.status(400).send({ message: 'Credenciais inválidas.' })
      }

      // 2) Valida senha
      const isPasswordValid = await compare(password, user[0].password_hash)

      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'Credenciais inválidas.' })
      }

      // 3) Busca plantas vinculadas ao usuário (JOIN)
      const linkedPlants = await db
        .select({
          id: plants.id,
          name: plants.name,
          role: userPlants.role,
        })
        .from(userPlants)
        .innerJoin(plants, eq(userPlants.plantId, plants.id))
        .where(eq(userPlants.userId, user[0].id))

      if (linkedPlants.length === 0) {
        return reply
          .status(400)
          .send({ message: 'Usuário não vinculado a nenhuma planta.' })
      }

      // 4) Se o usuário tiver só 1 planta → já loga direto
      if (linkedPlants.length === 1) {
        const token = await reply.jwtSign(
          {
            sub: user[0].id,
            role: user[0].role,
            plantRole: linkedPlants[0].role,
            plantId: linkedPlants[0].id,
          },
          {
            sign: {
              expiresIn: '2d',
            },
          },
        )

        return reply.status(201).send({ token })
      }

      // 5) Se possuir mais de uma planta → retorna lista para o usuário escolher
      const shortToken = await reply.jwtSign(
        {
          sub: user[0].id,
        },
        { sign: { expiresIn: '2m' } },
      )

      return reply.status(201).send({
        token: shortToken,
        requiresPlantSelection: true,
        plants: linkedPlants,
      })
    },
  )
}
