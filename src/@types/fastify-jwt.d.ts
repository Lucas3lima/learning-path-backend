import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string
      role?: 'user' | 'manager'
      isTemporary?: boolean
      plantId?: string
      plantRole?: 'student' | 'manager'
    }
  }
}
