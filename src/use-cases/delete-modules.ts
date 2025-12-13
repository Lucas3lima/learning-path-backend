import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface DeleteJourneyUseCaseRequest {
  id: string
  journeySlug: string
  plantId?: string
}

export class DeleteModulesUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
  }

  async execute({ id, plantId, journeySlug }: DeleteJourneyUseCaseRequest) {
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

    const module = await this.modulesRepository.findByIdAndJourneyId(id,journey.id)

    if (!module) {
      throw new NotFoundError('Módulo não encontrado')
    }

    const deleted = await this.modulesRepository.delete(id)

    if (!deleted) {
      throw new GenericDeletingError(
        'Módulo não não pôde ser deletado.',
      )
    }

    return {
      deleted,
    }
  }
}
