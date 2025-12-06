import type {
  CreateJourneySectoresInput,
  JourneySectors,
  JourneysSectorsRepository,
} from '../journeys-sectors-repository.ts'

export class InMemoryJourneySectorsRepository
  implements JourneysSectorsRepository
{
  public items: JourneySectors[] = []

  async findAll(journeyId: string) {
    return this.items.filter((item) => item.journeyId === journeyId)
  }

  async findByJourneyIdAndSectorId(journeyId: string, sectorId: string) {
    const journeySec = this.items.find(
      (item) => item.journeyId === journeyId && item.sectorId === sectorId,
    )

    if (!journeySec) {
      return null
    }

    return journeySec
  }
  async create(data: CreateJourneySectoresInput) {
    const journeySec = {
      id: data.id ?? crypto.randomUUID(),
      journeyId: data.journeyId,
      sectorId: data.sectorId,

      created_at: new Date(),
    }

    this.items.push(journeySec)

    return journeySec
  }
}
