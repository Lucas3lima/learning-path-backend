import type {
  CreateJourneyInput,
  Journey,
  JourneysRepository,
} from '../journeys-repository.ts'

export class InMemoryJourneysRepository implements JourneysRepository {
  public items: Journey[] = []

  async findByPlantId(plantId: string): Promise<Journey[]> {
    const journeys = this.items.filter((item) => item.plantId === plantId)

    return journeys
  }

  async findById(id: string) {
    const journey = this.items.find((item) => item.id === id)

    if (!journey) {
      return null
    }

    return journey
  }
  async findBySlugAndPlant(slug: string, plantId: string) {
    const journey = this.items.find(
      (item) => item.slug === slug && item.plantId === plantId,
    )

    if (!journey) {
      return null
    }

    return journey
  }
  async create(data: CreateJourneyInput) {
    const journey = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      level: data.level ?? 'Beginner',
      responsibleId: data.responsibleId,
      plantId: data.plantId,
      thumbnail_url: null,

      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(journey)

    return journey
  }
}
