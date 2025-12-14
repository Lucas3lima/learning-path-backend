import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { journeys } from '../database/schema.ts'

export type Journey = InferSelectModel<typeof journeys>
export type CreateJourneyInput = InferInsertModel<typeof journeys>

export type EditJourneyInput = {
  id: string
  plantId: string
  title?: string
  slug?: string
  description?: string
  thumbnail_url?: string
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
  visible?: boolean
}

export interface JourneysRepository {
  findById(id: string): Promise<Journey | null>
  findByPlantId(plantId: string): Promise<Journey[]>
  findBySlugAndPlant(slug: string, plantId: string): Promise<Journey | null>
  findByIdAndPlant(id: string, plantId: string): Promise<Journey | null>
  create(data: CreateJourneyInput): Promise<Journey>
  edit(data: EditJourneyInput): Promise<Journey | null>
  delete(id: string): Promise<boolean>
}
