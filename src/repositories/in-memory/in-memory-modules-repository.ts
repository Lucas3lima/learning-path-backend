import type {
  CreateModuleInput,
  Modules,
  ModulesRepository,
} from '../modules-repository.ts'

export class InMemoryModulesRepository implements ModulesRepository {
  public items: Modules[] = []

  async findById(id: string) {
    const module = this.items.find((item) => item.id === id)

    if (!module) {
      return null
    }

    return module
  }
  async findBySlugAndJourneyId(slug: string, journeyId: string) {
    const journey = this.items.find(
      (item) => item.slug === slug && item.journeyId === journeyId,
    )

    if (!journey) {
      return null
    }

    return journey
  }
  async create(data: CreateModuleInput) {
    const module = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      order: data.order ?? 1,
      hour: data.hour ?? 0,
      journeyId: data.journeyId,

      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(module)

    return module
  }

  async nextOrder(journeyId: string): Promise<number> {
    const modules = this.items.filter((item) => item.journeyId === journeyId)

    if (modules.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...modules.map((m) => m.order ?? 0))

    return maxOrder + 1
  }
}
