import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

export const logoutRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/sessions/logout', async (_, reply) => {
    reply
      .clearCookie('token', { path: '/' })
      .clearCookie('pre_auth', { path: '/' })
      .status(204)
      .send()
  })
}
