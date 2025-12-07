import type {
  CreateJourneySectoresInput,
  JourneySectors,
  JourneysSectorsRepository,
} from '../journeys-sectors-repository.ts'

export class InMemoryJourneySectorsRepository
  implements JourneysSectorsRepository
{
  public items: JourneySectors[] = []
  public sectors: { id: string; name: string }[] = []
   async findAllJourneyId(journeyId: string): Promise<{ id: string; name: string }[]> {
    // pega os pivots desse journey
    const pivots = this.items.filter((item) => item.journeyId === journeyId)

    // transforma em { id, name } usando o sectorId para buscar o name
    return pivots.map((item) => {
      const sector = this.sectors.find((s) => s.id === item.sectorId)
      return {
        id: sector?.id ?? '',        // caso não encontre
        name: sector?.name ?? '',    // garante string
      }
    })
  }

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
