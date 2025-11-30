import { eq, type InferInsertModel } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { plants, type users } from '../../database/schema.ts'
import type { PlantsRepository } from '../plants-repository.ts'

export type CreateUserInput = InferInsertModel<typeof users>

export class DrizzlePlantsRepository implements PlantsRepository {
  async findById(id: string) {
    const [plant] = await db
      .select()
      .from(plants)
      .where(eq(plants.id, id))
      .limit(1)

    return plant
  }
}
