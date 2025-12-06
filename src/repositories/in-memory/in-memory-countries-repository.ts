import { createSlug } from '../../utils/create-slug.ts'
import type {
  CountriesRepository,
  Country,
  CreateCountryInput,
} from '../countries-repository.ts'

export class InMemoryCoutriesRepository implements CountriesRepository {
  public items: Country[] = []

  async create(data: CreateCountryInput) {
    const country = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      slug: createSlug(data.name),
      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(country)

    return country
  }

  async findById(id: string) {
    const plant = this.items.find((item) => item.id === id)

    if (!plant) return null

    return plant
  }
}
