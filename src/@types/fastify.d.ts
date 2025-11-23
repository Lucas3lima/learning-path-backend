import 'fastify'

declare module 'fastify' {
  export interface FastifyRequest {
    user?: {
      sub: string
      role?: 'user' | 'manager'
      plantRole?: 'student' | 'manager'
      plantId?: string
      isTemporary?: boolean
    }
  }
}
