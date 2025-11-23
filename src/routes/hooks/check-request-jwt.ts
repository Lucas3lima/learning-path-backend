import type { FastifyReply, FastifyRequest } from 'fastify'

export async function checkRequestJWT(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.headers.authorization

  if (!token) {
    return reply.status(401).send({ message: 'Token não encontrado.' })
  }

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
      isTemporary: !user.plantId, // Se plantId não existe -> temporário
    }
    // console.log(`Check-Request-JWT. User:  ${request.user.sub}` )
  } catch {
    return reply.status(401).send({ message: 'Token inválido.' })
  }
}
