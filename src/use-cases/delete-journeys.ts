import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { PlantsRepository } from '../repositories/plants-repository.ts'
import type { StorageProvider } from '../repositories/storage-provider.ts'

interface DeleteJourneyUseCaseRequest {
  id: string
  plantId?: string
}

export class DeleteJourneysUseCase {
  private plantsRepository: PlantsRepository
  private journeysRepository: JourneysRepository
  private storageProvider: StorageProvider
  constructor(
    plantsRepository: PlantsRepository,
    journeysRepository: JourneysRepository,
    storageProvider: StorageProvider,
  ) {
    this.plantsRepository = plantsRepository
    this.journeysRepository = journeysRepository
    this.storageProvider = storageProvider
  }
  async execute({ id, plantId }: DeleteJourneyUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const plant = await this.plantsRepository.findById(plantId)

    if (!plant) {
      throw new PlantNotFoundError()
    }

    const journey = await this.journeysRepository.findByIdAndPlant(id, plant.id)

    if(!journey){
      throw new NotFoundError('Trilha não encontrada!')
    }

    await this.storageProvider.deleteFolder(`uploads/${plant.slug}/${journey.slug}`)

    const deleted = await this.journeysRepository.delete(journey.id)

    if (!deleted) {
      throw new GenericDeletingError(
        'Trilha não pôde ser deletada.',
      )
    }

    return {
      deleted,
    }
  }
}
