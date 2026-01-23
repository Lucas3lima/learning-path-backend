import type { FastifyReply, FastifyRequest } from 'fastify'

export async function checkRequestJWT(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const user = await request.jwtVerify<{
      sub: string
      role?: 'user' | 'manager'
      plantRole?: 'student' | 'manager'
      plantId?: string
    }>()

    request.user = {
      sub: user.sub,
      role: user.role,
      plantRole: user.plantRole,
      plantId: user.plantId,
      isTemporary: !user.plantId,
    }
  } catch {
    return reply.status(401).send({ message: 'Token inválido.' })
  }
}
