import { error } from 'node:console'
import path from 'node:path'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { fastifySwagger } from '@fastify/swagger'
import scalarAPIReference from '@scalar/fastify-api-reference'
import fastify, { type FastifyError } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import z, { ZodError } from 'zod'
import { config } from './config/env.ts'
import { authenticateRoute } from './routes/auth/authenticate.ts'
import { createAccountRoute } from './routes/auth/create-account.ts'
import { getProfileRoute } from './routes/auth/get-profile.ts'
import { selectPlantRoute } from './routes/auth/select-plant.ts'
import { createJourneys } from './routes/journeys/create-journeys.ts'
import { getAllJourneysRoute } from './routes/journeys/get-all-journeys.ts'
import { getJourneyOverviewRoute } from './routes/journeys/get-journeys-by-slug.ts'
import { createLessons } from './routes/lessons/create-lessons.ts'
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
  secret: config.JWT_SECRET,
})

app.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, //10MB
  },
})

app.register(fastifyStatic, {
  root: path.resolve('uploads'),
  prefix: '/uploads/',
})



app.register(createAccountRoute)
app.register(getUsersRoute)

// AUTH
app.register(authenticateRoute)
app.register(getProfileRoute)
app.register(selectPlantRoute)

// JOURNEYS
app.register(createJourneys)
app.register(getJourneyOverviewRoute)
app.register(getAllJourneysRoute)

// MODULES
app.register(createModules)

// LESSONS
app.register(createLessons)


app.setErrorHandler((error, request, reply) => {
  // 1️⃣ Erros do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      status: 'error',
      code: 'VALIDATION_FAILED',
      detail: 'Alguns dados enviados são inválidos.',
      errors: error.flatten().fieldErrors,
    })
  }

  // 2️⃣ Erros do Fastify (ex: validação do schema)
  if (typeof error === 'object' && error && 'validation' in error) {
    const fastifyError = error as FastifyError & { validation?: any }
    return reply.status(400).send({
      status: 'error',
      code: 'VALIDATION_FAILED',
      detail: fastifyError.message,
      errors: fastifyError.validation,
    })
  }

  // 3️⃣ Outros erros desconhecidos
  console.error(error)

  return reply.status(500).send({
    status: 'error',
    code: 'SERVER_ERROR',
    detail: 'Erro interno no servidor.',
  })
})

export { app }
