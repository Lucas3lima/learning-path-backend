import { JourneysAlreadyExistsError } from '../_erros/journeys-already-exists-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { JourneysSectorsRepository } from '../repositories/journeys-sectors-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface CreateJourneysUseCaseRequest {
  title: string
  description?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  sectorsIds: string[]
  responsibleId: string
  plantId?: string
}
export class CreateJourneysUseCase {
  private journeysRepository: JourneysRepository
  private journeySectorRepository: JourneysSectorsRepository
  constructor(
    journeysRepository: JourneysRepository,
    journeySectorRepository: JourneysSectorsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.journeySectorRepository = journeySectorRepository
  }
  async execute({
    title,
    description,
    level,
    sectorsIds,
    responsibleId,
    plantId,
  }: CreateJourneysUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }
    const slug = createSlug(title)

    const existingJourney = await this.journeysRepository.findBySlugAndPlant(
      slug,
      plantId,
    )

    if (existingJourney) {
      throw new JourneysAlreadyExistsError()
    }
    
    const journey = await this.journeysRepository.create({
      title,
      slug,
      description,
      level,
      responsibleId,
      plantId,
    })

    await Promise.all(
      sectorsIds.map(async (sectorId) => {
        const exists =
          await this.journeySectorRepository.findByJourneyIdAndSectorId(
            journey.id,
            sectorId,
          )

        if (!exists) {
          await this.journeySectorRepository.create({
            journeyId: journey.id,
            sectorId,
          })
        }
      }),
    )

    return {
      journey,
    }
  }
}
