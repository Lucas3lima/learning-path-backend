import { createSlug } from '../../utils/create-slug.ts'
import type {
  CreatePlantInput,
  Plant,
  PlantsRepository,
} from '../plants-repository.ts'

export class InMemoryPlantsRepository implements PlantsRepository {
  public items: Plant[] = []

  async create(data: CreatePlantInput) {
    const plant = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      slug: createSlug(data.name),
      country_id: data.country_id,
      created_at: new Date(),
    }

    this.items.push(plant)

    return plant
  }

  async findById(id: string) {
    const plant = this.items.find((item) => item.id === id)

    if (!plant) return null

    return plant
  }
}
