import { InvalidFileTypeError } from '../_erros/invalid-file-type-error.ts'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { PlantsRepository } from '../repositories/plants-repository.ts'
import type { StorageProvider } from '../repositories/storage-provider.ts'
import { createSlug } from '../utils/create-slug.ts'

interface CreateLessonsUseCaseRequest {
  title: string
  content?: string
  video_url?: string
  journeySlug: string
  plantId?: string
  moduleSlug: string
  file?: {
    stream: AsyncIterable<Uint8Array> | NodeJS.ReadableStream
    mimetype: string
  }
}
export class CreateLessonsUseCase {
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
    title,
    content,
    video_url,
    journeySlug,
    plantId,
    moduleSlug,
    file,
  }: CreateLessonsUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const existingPlant = await this.plantsRepository.findById(plantId)

    if (!existingPlant) {
      throw new PlantNotFoundError()
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
      moduleSlug,
      existingJourney.id,
    )

    if (!existingModules) {
      throw new NotFoundError('Módulo não encontrado!')
    }

    const existingLessons = await this.lessonsRepository.findBySlugAndModuleId(
      slug,
      existingModules.id,
    )

    if (existingLessons) {
      throw new LessonsAlreadyExistsError()
    }

    const nextOrder = await this.lessonsRepository.nextOrder(existingModules.id)

    let pdf_url: string | null = null

    if (file) {
      if (file.mimetype !== 'application/pdf') {
        throw new InvalidFileTypeError()
      }

      const folder = `${existingPlant.slug}/${journeySlug}/${moduleSlug}`

      pdf_url = await this.storageProvider.saveFile(
        file.stream,
        `${slug}.pdf`,
        folder,
      )
    }

    const lesson = await this.lessonsRepository.create({
      title,
      slug,
      content,
      order: nextOrder,
      pdf_url,
      video_url,
      moduleId: existingModules.id,
    })

    return {
      lesson,
    }
  }
}
