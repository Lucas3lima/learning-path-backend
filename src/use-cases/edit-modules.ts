import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { ModulesAlreadyExistsError } from '../_erros/modules-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface EditModulesUseCaseRequest {
  id: string
  journeySlug: string
  plantId?: string
  title?: string
  description?: string
  order?: number
  hour?: number
}

export class EditModulesUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  constructor(
    modulesRepository: ModulesRepository,
    journeysRepository: JourneysRepository,
  ) {
    this.modulesRepository = modulesRepository
    this.journeysRepository = journeysRepository
  }
  async execute({
    id,
    title,
    description,
    plantId,
    order,
    hour,
    journeySlug,
  }: EditModulesUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const journey = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!journey) {
      throw new NotFoundError('Trilha não encontrada!')
    }

    let slug: string | undefined

    if (title) {
      slug = createSlug(title)

      const existingModule =
        await this.modulesRepository.findBySlugAndJourneyId(slug, journey.id)

      if (existingModule) {
        throw new ModulesAlreadyExistsError()
      }
    }

    const module = await this.modulesRepository.edit({
      id,
      title,
      slug,
      description,
      order,
      hour,
      journeyId: journey.id,
    })

    if (!module) {
      throw new GenericEditingError(
        'Módulo não encontrado ou não pôde ser atualizado.',
      )
    }

    return {
      module,
    }
  }
}
