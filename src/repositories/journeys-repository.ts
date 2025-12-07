import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { journeys } from '../database/schema.ts'

export type Journey = InferSelectModel<typeof journeys>
export type CreateJourneyInput = InferInsertModel<typeof journeys>

export interface JourneysRepository {
  findById(id: string): Promise<Journey | null>
  findByPlantId(plantId: string): Promise<Journey[]>
  findBySlugAndPlant(slug: string, plantId: string): Promise<Journey | null>
  create(data: CreateJourneyInput): Promise<Journey>
}
