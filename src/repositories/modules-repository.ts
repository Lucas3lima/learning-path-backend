import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { modules } from '../database/schema.ts'

export type Modules = InferSelectModel<typeof modules>
export type CreateModuleInput = InferInsertModel<typeof modules>

export type EditModuleInput = {
  id: string
  journeyId: string
  title?: string
  slug?: string
  description?: string
  order?: number
  hour?: number
}

export interface ModulesRepository {
  findById(id: string): Promise<Modules | null>
  findBySlugAndJourneyId(
    slug: string,
    journeyId: string,
  ): Promise<Modules | null>
  findByIdAndJourneyId(
    id: string,
    journeyId: string,
  ): Promise<Modules | null>
  create(data: CreateModuleInput): Promise<Modules>
  nextOrder(journeyId: string): Promise<number>
  findByJourneyId(journeyId: string): Promise<
    {
      id: string
      title: string
      slug: string
      order: number
      hour: number
      description: string | null
    }[]
  >
  edit(data: EditModuleInput): Promise<Modules | null>
  delete(id: string): Promise<boolean>
}
