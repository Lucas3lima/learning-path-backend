import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { journeys } from '../../database/schema.ts'
import type {
  CreateJourneyInput,
  EditJourneyInput,
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
  async findByIdAndPlant(id: string, plantId: string) {
    const [journey] = await db
      .select()
      .from(journeys)
      .where(and(eq(journeys.id, id), eq(journeys.plantId, plantId)))

    if (!journey) {
      return null
    }

    return journey
  }
  async create(data: CreateJourneyInput) {
    const [journey] = await db.insert(journeys).values(data).returning()

    return journey
  }

  async edit(data: EditJourneyInput) {
    const { id, plantId, ...fields } = data

    const [updated] = await db
      .update(journeys)
      .set(fields)
      .where(and(eq(journeys.id, id), eq(journeys.plantId, plantId)))
      .returning()

    return updated ?? null
  }

  async delete(id: string) {
    const result = await db
      .delete(journeys)
      .where(eq(journeys.id, id))
      .returning({ id: journeys.id })

    // Se deletou, result[0] existe
    return result.length > 0
  }
}
