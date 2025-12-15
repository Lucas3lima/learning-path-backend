import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { InvalidFileTypeError } from '../_erros/invalid-file-type-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { PlantsRepository } from '../repositories/plants-repository.ts'
import type { StorageProvider } from '../repositories/storage-provider.ts'

interface EditLessonsPDFUseCaseRequest {
  id: string
  journeySlug: string
  moduleSlug: string
  plantId?: string
  file: {
    stream: AsyncIterable<Uint8Array> | NodeJS.ReadableStream
    mimetype: string
  }
}
export class EditLessonsPDFUseCase {
  private plantsRepository: PlantsRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepository: LessonsRepository
  private storageProvider: StorageProvider

  constructor(
    plantsRepository: PlantsRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepository: LessonsRepository,
    storageProvider: StorageProvider,
  ) {
    this.plantsRepository = plantsRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepository = lessonsRepository
    this.storageProvider = storageProvider
  }
  async execute({
    journeySlug,
    plantId,
    moduleSlug,
    file,
    id,
  }: EditLessonsPDFUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const existingPlant = await this.plantsRepository.findById(plantId)

    if (!existingPlant) {
      throw new PlantNotFoundError()
    }

    const existingJourney = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!existingJourney) {
      throw new JourneysNotFoundError()
    }

    const existingModules = await this.modulesRepository.findBySlugAndJourneyId(
      moduleSlug,
      existingJourney.id,
    )

    if (!existingModules) {
      throw new ModulesNotFoundError()
    }

    const existingLessons = await this.lessonsRepository.findByIdAndModuleId(
      id,
      existingModules.id,
    )

    if (!existingLessons) {
      throw new LessonsNotFoundError()
    }

    let pdf_url: string | null = null

    if (file.mimetype !== 'application/pdf') {
      throw new InvalidFileTypeError()
    }

    const folder = `${existingPlant.slug}/${journeySlug}/${moduleSlug}`

    pdf_url = await this.storageProvider.replaceFile(
      existingLessons.pdf_url,
      file.stream,
      `${existingLessons.slug}.pdf`,
      folder,
    )

    const lesson = await this.lessonsRepository.edit({
      id: existingLessons.id,
      pdf_url,
    })

    if (!lesson) {
      throw new GenericEditingError('Não foi possível alterar o arquivo.')
    }

    return {
      lesson,
    }
  }
}
