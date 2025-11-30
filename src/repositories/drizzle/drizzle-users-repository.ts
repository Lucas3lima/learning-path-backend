import { eq, type InferInsertModel } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { users } from '../../database/schema.ts'
import type { UsersRepository } from '../users-repository.ts'

export type CreateUserInput = InferInsertModel<typeof users>

export class DrizzleUsersRepository implements UsersRepository {
  async getProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        registration_number: users.registration_number,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
    return {user}
  }
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user
  }
  async findByRegistration(registration: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.registration_number, registration))
      .limit(1)

    return user
  }
  async create(data: CreateUserInput) {
    const [user] = await db.insert(users).values(data).returning()

    return user
  }
}
