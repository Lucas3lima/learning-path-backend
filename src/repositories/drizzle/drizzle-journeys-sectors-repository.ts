import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { journey_sectors } from '../../database/schema.ts'
import type {
  CreateJourneySectoresInput,
  JourneysSectorsRepository,
} from '../journeys-sectors-repository.ts'

export class DrizzleJourneySectorsRepository
  implements JourneysSectorsRepository
{
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
