import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import { fastifySwagger } from '@fastify/swagger'
import scalarAPIReference from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { authenticateRoute } from './routes/auth/authenticate.ts'
import { createAccountRoute } from './routes/auth/create-account.ts'
import { getProfileRoute } from './routes/auth/get-profile.ts'
import { selectPlantRoute } from './routes/auth/select-plant.ts'
import { createJourneys } from './routes/journeys/create-journeys.ts'
import { getJourneysBySlug } from './routes/journeys/get-journeys-by-slug.ts'
import { createModules } from './routes/modules/create-modules.ts'
import { getUsersRoute } from './routes/users/get-users.ts'

const app = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELTE', 'OPTIONS'],
})

if (process.env.NODE_ENV === 'development') {
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'learning-path',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(scalarAPIReference, {
    routePrefix: '/docs',
  })
}

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyJwt, {
  secret: 'my-secret-jwt',
})

app.register(createAccountRoute)
app.register(getUsersRoute)

// AUTH
app.register(authenticateRoute)
app.register(getProfileRoute)
app.register(selectPlantRoute)

// JOURNEYS
app.register(createJourneys)
app.register(getJourneysBySlug)

// MODULES
app.register(createModules)

export { app }
