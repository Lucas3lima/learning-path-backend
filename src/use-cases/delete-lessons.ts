import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { StorageProvider } from '../repositories/storage-provider.ts'

interface DeleteLessonsUseCaseRequest {
  id: string
  journeySlug: string
  moduleSlug: string
  plantId?: string
}

export class DeleteLessonsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepository: LessonsRepository
  private storageProvider: StorageProvider
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepository: LessonsRepository,
    storageProvider: StorageProvider,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepository = lessonsRepository
    this.storageProvider = storageProvider
  }

  async execute({
    id,
    plantId,
    journeySlug,
    moduleSlug,
  }: DeleteLessonsUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const journey = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!journey) {
      throw new JourneysNotFoundError()
    }

    const module = await this.modulesRepository.findBySlugAndJourneyId(
      moduleSlug,
      journey.id,
    )

    if (!module) {
      throw new ModulesNotFoundError()
    }

    const lesson = await this.lessonsRepository.findByIdAndModuleId(
      id,
      module.id,
    )

    if (!lesson) {
      throw new LessonsNotFoundError()
    }
    console.log(lesson.pdf_url)
    if (lesson.pdf_url) {
      await this.storageProvider.deleteFile(lesson.pdf_url)
    }
    const deleted = await this.lessonsRepository.delete(id)

    if (!deleted) {
      throw new GenericDeletingError('Aula não não pôde ser deletada.')
    }

    return {
      deleted,
    }
  }
}
