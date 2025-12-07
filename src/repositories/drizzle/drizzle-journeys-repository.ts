import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { journeys } from '../../database/schema.ts'
import type {
  CreateJourneyInput,
  JourneysRepository,
} from '../journeys-repository.ts'

export class DrizzleJourneysRepository implements JourneysRepository {
  async findById(id: string) {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(eq(journeys.id, id))

    if (!journey) {
      return null
    }

    return journey
  }
  async findByPlantId(plantId: string) {
    const journey = await db
      .select()
      .from(journeys)
      .where(eq(journeys.plantId, plantId))

    return journey
  }
  async findBySlugAndPlant(slug: string, plantId: string) {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(and(eq(journeys.slug, slug), eq(journeys.plantId, plantId)))

    if (!journey) {
      return null
    }

    return journey
  }
  async create(data: CreateJourneyInput) {
    const [journey] = await db.insert(journeys).values(data).returning()

    return journey
  }
}
