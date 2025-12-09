import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { journey_sectors, sectors } from '../../database/schema.ts'
import type {
  CreateJourneySectoresInput,
  JourneysSectorsRepository,
} from '../journeys-sectors-repository.ts'

export class DrizzleJourneySectorsRepository
  implements JourneysSectorsRepository
{
  async findAllJourneyId(journeyId: string) {
    return await db
      .select({
        id: sectors.id,
        name: sectors.name,
      })
      .from(journey_sectors)
      .innerJoin(sectors, eq(sectors.id, journey_sectors.sectorId))
      .where(eq(journey_sectors.journeyId, journeyId))
  }
  async findAll(journeyId: string) {
    const JourneysSec = await db
      .select()
      .from(journey_sectors)
      .where(eq(journey_sectors.journeyId, journeyId))

    return JourneysSec
  }
  async findByJourneyIdAndSectorId(journeyId: string, sectorId: string) {
    const [journeySec] = await db
      .select()
      .from(journey_sectors)
      .where(
        and(
          eq(journey_sectors.journeyId, journeyId),
          eq(journey_sectors.sectorId, sectorId),
        ),
      )

    if (!journeySec) {
      return null
    }

    return journeySec
  }

  async create(data: CreateJourneySectoresInput) {
    const [journeySec] = await db
      .insert(journey_sectors)
      .values(data)
      .returning()

    return journeySec
  }
}
