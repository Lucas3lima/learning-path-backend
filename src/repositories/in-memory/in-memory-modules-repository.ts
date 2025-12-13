import type {
  CreateModuleInput,
  EditModuleInput,
  Modules,
  ModulesRepository,
} from '../modules-repository.ts'

export class InMemoryModulesRepository implements ModulesRepository {
  
  public items: Modules[] = []
  async findByJourneyId(journeyId: string) {
    return this.items
      .filter((item) => item.journeyId === journeyId)
      .map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        order: item.order,
        hour: item.hour,
        description: item.description ?? null,
      }))
  }

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
  async findByIdAndJourneyId(id: string, journeyId: string) {
    const journey = this.items.find(
      (item) => item.id === id && item.journeyId === journeyId,
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

  async nextOrder(journeyId: string) {
    const modules = this.items.filter((item) => item.journeyId === journeyId)

    if (modules.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...modules.map((m) => m.order ?? 0))

    return maxOrder + 1
  }

  async edit(data: EditModuleInput): Promise<Modules | null> {
    const moduleIndex = this.items.findIndex(
      (item) => item.id === data.id,
    )

    if (moduleIndex === -1) {
      return null
    }

    const module = this.items[moduleIndex]

    const updatedModule: Modules = {
      ...module,
      title: data.title ?? module.title,
      slug: data.slug ?? module.slug,
      description: data.description ?? module.description,
      order: data.order ?? module.order,
      hour: data.hour ?? module.hour,
      updated_at: new Date(),
    }

    this.items[moduleIndex] = updatedModule

    return updatedModule
  }

  async delete(id: string) {
    const index = this.items.findIndex(
      (item) => item.id === id,
    )

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }
}
