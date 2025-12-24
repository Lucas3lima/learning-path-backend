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
import { ZodError } from 'zod'
import { config } from './config/env.ts'
import { authenticateRoute } from './routes/auth/authenticate.ts'
import { createAccountRoute } from './routes/auth/create-account.ts'
import { getProfileRoute } from './routes/auth/get-profile.ts'
import { selectPlantRoute } from './routes/auth/select-plant.ts'
import { createExams } from './routes/exams/create-exams.ts'
import { createJourneys } from './routes/journeys/create-journeys.ts'
import { deleteJourneys } from './routes/journeys/delete-journeys.ts'
import { editJourneys } from './routes/journeys/edit-journeys.ts'
import { getAllJourneysRoute } from './routes/journeys/get-all-journeys.ts'
import { getJourneyOverviewRoute } from './routes/journeys/get-journeys-by-slug.ts'
import { createLessons } from './routes/lessons/create-lessons.ts'
import { deleteLessons } from './routes/lessons/delete-lessons.ts'
import { editLessons } from './routes/lessons/edit-lessons.ts'
import { editLessonsPDFs } from './routes/lessons/edit-lessons-pdf.ts'
import { createModules } from './routes/modules/create-modules.ts'
import { deleteModules } from './routes/modules/delete-modules.ts'
import { editModules } from './routes/modules/edit-modules.ts'
import { ListModuleLessonsRoute } from './routes/modules/list-module-contents.ts'
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
app.register(editJourneys)
app.register(deleteJourneys)

// MODULES
app.register(createModules)
app.register(editModules)
app.register(deleteModules)

// LESSONS
app.register(createLessons)
app.register(ListModuleLessonsRoute)
app.register(editLessons)
app.register(editLessonsPDFs)
app.register(deleteLessons)

// EXAMS
app.register(createExams)

app.setErrorHandler((error, request, reply) => {
  // 🔹 Se for erro de validação do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: error.message,
      issues: error,
    })
  }

  // 🔹 Se for erro de validação do Fastify (ex.: body ausente)
  if ((error as FastifyError).validation) {
    return reply.status(400).send({
      message: (error as FastifyError).message,
      issues: (error as FastifyError).validation,
    })
  }

  // 🔹 Outros erros → 500
  console.error(error)
  return reply.status(500).send({
    message: 'Internal server error.',
  })
})

export { app }
