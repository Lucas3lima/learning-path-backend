import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { PlantsRepository } from '../repositories/plants-repository.ts'
import type { StorageProvider } from '../repositories/storage-provider.ts'

interface DeleteJourneyUseCaseRequest {
  id: string
  journeySlug: string
  plantId?: string
}

export class DeleteModulesUseCase {
  private plantsRepository: PlantsRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private storageProvider: StorageProvider
  constructor(
    plantsRepository: PlantsRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    storageProvider: StorageProvider,
  ) {
    this.plantsRepository = plantsRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.storageProvider = storageProvider
  }

  async execute({ id, plantId, journeySlug }: DeleteJourneyUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const plant = await this.plantsRepository.findById(plantId)

    if (!plant) {
      throw new PlantNotFoundError()
    }

    const journey = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!journey) {
      throw new JourneysNotFoundError()
    }

    const module = await this.modulesRepository.findByIdAndJourneyId(
      id,
      journey.id,
    )

    if (!module) {
      throw new ModulesNotFoundError()
    }

    await this.storageProvider.deleteFolder(
      `uploads/${plant.slug}/${journey.slug}/${module.slug}`,
    )

    const deleted = await this.modulesRepository.delete(id)

    if (!deleted) {
      throw new GenericDeletingError('Módulo não não pôde ser deletado.')
    }

    return {
      deleted,
    }
  }
}
