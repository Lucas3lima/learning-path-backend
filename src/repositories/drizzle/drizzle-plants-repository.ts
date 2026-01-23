import { eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { plants } from '../../database/schema.ts'
import type {
  CreatePlantInput,
  Plant,
  PlantsRepository,
} from '../plants-repository.ts'

export class DrizzlePlantsRepository implements PlantsRepository {
  async findById(id: string) {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id))

    if (!plant) {
      return null
    }

    return plant
  }

  async create(data: CreatePlantInput) {
    const [plant] = await db.insert(plants).values(data).returning()

    return plant
  }
  async getAll() {
    return await db.select().from(plants)
  }
}
