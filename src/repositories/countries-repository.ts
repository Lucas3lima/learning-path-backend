import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { countries } from '../database/schema.ts'

export type Country = InferSelectModel<typeof countries>
export type CreateCountryInput = InferInsertModel<typeof countries>

export interface CountriesRepository {
  findById(id: string): Promise<Country | null>
  create(data: CreateCountryInput): Promise<Country>
}
