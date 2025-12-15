import type { FastifyReply, FastifyRequest } from 'fastify'
import { getAuthenticatedUser } from './get-authenticate-user.ts'

export function checkPlantRole(role: 'student' | 'manager') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthenticatedUser(request)

    if (user.plantRole !== role) {
      return reply
        .status(403)
        .send({ message: 'Você não tem permissão para acessar este recurso.' })
    }
  }
}
