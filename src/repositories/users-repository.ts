import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { users } from '../database/schema.ts'

export type User = InferSelectModel<typeof users>
export type CreateUserInput = InferInsertModel<typeof users>

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  findByRegistration(registration: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  getProfile(userId: string): Promise<{
  user: {
    id: string
    name: string | null
    email: string
    registration_number: string
    role: 'user' | 'manager'
  } | null
}>

}
