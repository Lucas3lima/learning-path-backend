import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { journey_sectors } from '../database/schema.ts'

export type JourneySectors = InferSelectModel<typeof journey_sectors>
export type CreateJourneySectoresInput = InferInsertModel<
  typeof journey_sectors
>

export interface JourneysSectorsRepository {
  findByJourneyIdAndSectorId(
    journeyId: string,
    sectorId: string,
  ): Promise<JourneySectors | null>
  findAll(journeyId: string): Promise<JourneySectors[]>
  create(data: CreateJourneySectoresInput): Promise<CreateJourneySectoresInput>
  findAllJourneyId(journeyId: string): Promise<{ id: string; name: string }[]>
}
