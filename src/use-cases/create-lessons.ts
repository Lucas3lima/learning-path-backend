import { InvalidFileTypeError } from '../_erros/invalid-file-type-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
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
  private moduleContentsRepository: ModuleContentsRepository

  constructor(
    plantsRepository: PlantsRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepository: LessonsRepository,
    storageProvider: StorageProvider,
    moduleContentsRepository: ModuleContentsRepository,
  ) {
    this.plantsRepository = plantsRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepository = lessonsRepository
    this.storageProvider = storageProvider
    this.moduleContentsRepository = moduleContentsRepository
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
      throw new JourneysNotFoundError()
    }

    const existingModules = await this.modulesRepository.findBySlugAndJourneyId(
      moduleSlug,
      existingJourney.id,
    )

    if (!existingModules) {
      throw new ModulesNotFoundError()
    }

    const existingLessons = await this.lessonsRepository.findBySlugAndModuleId(
      slug,
      existingModules.id,
    )

    if (existingLessons) {
      throw new LessonsAlreadyExistsError()
    }

    let pdf_url: string | null = null

    if (file) {
      if (file.mimetype !== 'application/pdf') {
        throw new InvalidFileTypeError()
      }

      const folder = `${existingPlant.slug}/${existingJourney.slug}/${existingModules.slug}`

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
      pdf_url,
      video_url,
      moduleId: existingModules.id,
    })

    const nextOrder = await this.moduleContentsRepository.nextOrder(existingModules.id)

    const moduleContent = await this.moduleContentsRepository.create({
      moduleId: existingModules.id,
      type: 'lesson',
      lessonId: lesson.id,
      order: nextOrder
    })

    return {
      lesson,
      moduleContent
    }
  }
}
