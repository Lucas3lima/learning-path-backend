import { ModulesAlreadyExistsError } from '../_erros/modules-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface CreateModulesUseCaseRequest {
  title: string
  description?: string
  hour: number
  journeySlug: string
  plantId?: string
}
export class CreateModuleUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
  }
  async execute({
    title,
    description,
    hour,
    journeySlug,
    plantId,
  }: CreateModulesUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }
    const slug = createSlug(title)

    const existingJourney = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!existingJourney) {
      throw new NotFoundError('Trilha não encontrada!')
    }

    const existingModules = await this.modulesRepository.findBySlugAndJourneyId(
      slug,
      existingJourney.id,
    )

    if (existingModules) {
      throw new ModulesAlreadyExistsError()
    }

    const nextOrder = await this.modulesRepository.nextOrder(existingJourney.id)

    const module = await this.modulesRepository.create({
      title,
      slug,
      description,
      hour,
      order: nextOrder,
      journeyId: existingJourney.id,
    })

    return {
      module,
    }
  }
}
