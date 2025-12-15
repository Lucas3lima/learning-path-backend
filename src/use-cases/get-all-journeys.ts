import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { JourneysSectorsRepository } from '../repositories/journeys-sectors-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface GetAllJourneysUseCaseRequest {
  plantId?: string
}
interface GetAllJourneysUseCaseReponse {
  id: string
  title: string
  slug: string
  description: string | null
  level: string
  thumbnail_url: string | null
  visible: boolean
  sectors: {
    id: string
    name: string
  }[]
  responsible: {
    id: string
    name: string | null
    email: string
  }
  totalHours: number
  totalModules: number
}
export class GetAllJourneysUseCase {
  private usersRepository: UsersRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private journeysSectorsRepository: JourneysSectorsRepository
  constructor(
    usersRepository: UsersRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    journeysSectorsRepository: JourneysSectorsRepository,
  ) {
    this.usersRepository = usersRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.journeysSectorsRepository = journeysSectorsRepository
  }
  async execute({
    plantId,
  }: GetAllJourneysUseCaseRequest): Promise<GetAllJourneysUseCaseReponse[]> {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const journeysResult = await this.journeysRepository.findByPlantId(plantId)

    if (journeysResult.length > 0) {
      const journeysResponse = await Promise.all(
        journeysResult.map(async (journey) => {
          const responsible = await this.usersRepository.findById(
            journey.responsibleId,
          )

          const journeyModules = await this.modulesRepository.findByJourneyId(
            journey.id,
          )

          const journeySectorsResult =
            await this.journeysSectorsRepository.findAllJourneyId(journey.id)

          const totalHours = journeyModules.reduce((acc, m) => acc + m.hour, 0)
          const totalModules = journeyModules.length

          return {
            id: journey.id,
            title: journey.title,
            slug: journey.slug,
            description: journey.description,
            level: journey.level,
            thumbnail_url: journey.thumbnail_url,
            visible: journey.visible,

            responsible: {
              id: responsible?.id ?? '',
              name: responsible?.name ?? null,
              email: responsible?.email ?? '',
            },

            sectors: journeySectorsResult.map((s) => ({
              id: s.id,
              name: s.name,
            })),

            totalHours,
            totalModules,
          }
        }),
      )
      return journeysResponse
    }
    return []
  }
}
