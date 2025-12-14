import type {
  CreateJourneyInput,
  EditJourneyInput,
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
  async findByIdAndPlant(id: string, plantId: string) {
    const journey = this.items.find(
      (item) => item.id === id && item.plantId === plantId,
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
      visible: data.visible ?? true,
      
      created_at: new Date(),
      updated_at: new Date(),
    }
    
    this.items.push(journey)
    
    return journey
  }

  async edit(data: EditJourneyInput){
    const journeyIndex = this.items.findIndex(
      (item) => item.id === data.id && item.plantId === data.plantId,
    )

    if (journeyIndex === -1) {
      return null
    }

    const journey = this.items[journeyIndex]

    const updatedJourney: Journey = {
      ...journey,
      title: data.title ?? journey.title,
      slug: data.slug ?? journey.slug,
      description: data.description ?? journey.description,
      thumbnail_url: data.thumbnail_url ?? journey.thumbnail_url,
      level: data.level ?? journey.level,
      visible: data.visible ?? journey.visible,
      updated_at: new Date(),
    }

    this.items[journeyIndex] = updatedJourney

    return updatedJourney
  }


  async delete(id: string) {
    const index = this.items.findIndex(
      (item) => item.id === id
    )

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }


}
