import { and, eq, type InferInsertModel } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { plants, userPlants } from '../../database/schema.ts'
import type {
  UserPlants,
  UserPlantsRepository,
} from '../userPlants-repository.ts'

export type CreateUserPlantsInput = InferInsertModel<typeof userPlants>

export class DrizzleUserPlantsRepository implements UserPlantsRepository {
  async linkedPlants(userId: string) {
    const result = await db
      .select({
        id: plants.id,
        name: plants.name,
        role: userPlants.role,
      })
      .from(userPlants)
      .innerJoin(plants, eq(userPlants.plantId, plants.id))
      .where(eq(userPlants.userId, userId))

    return result
  }
  async create(data: CreateUserPlantsInput) {
    const [userPlant] = await db.insert(userPlants).values(data).returning()

    return userPlant
  }
  async findByUserIdAndPlantId(userId: string, plantId: string) {
    const [userPlant] = await db
      .select()
      .from(userPlants)
      .where(
        and(eq(userPlants.plantId, plantId), eq(userPlants.userId, userId)),
      )
      .limit(1)

    return userPlant
  }
}
