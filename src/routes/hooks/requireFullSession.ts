import type { FastifyReply, FastifyRequest } from 'fastify'

export async function requireFullSession(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.user) {
    return reply.status(401).send({ message: 'Usuário não autenticado.' })
  }

  if (request.user.isTemporary) {
    return reply.status(403).send({
      message: 'É necessário selecionar uma planta para continuar.'})
  }

  return
}
