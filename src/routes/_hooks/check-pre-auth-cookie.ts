// src/routes/_hooks/check-pre-auth-cookie.ts

import type { FastifyReply, FastifyRequest } from 'fastify'

export async function checkPreAuthCookie(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    await request.jwtVerify<{ sub: string }>({ onlyCookie: true })
  } catch {
    return reply.status(401).send({ message: 'Unauthorized.' })
  }
}
