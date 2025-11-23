import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuthenticatedUser } from './get-authenticate-user.ts'

export function checkUserRole(role: 'studant' | 'manager') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthenticatedUser(request)

    if (user.role !== role) {
      return reply.status(401).send()
    }
  }
}
