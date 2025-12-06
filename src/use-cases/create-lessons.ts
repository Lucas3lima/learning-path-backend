import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface CreateLessonsUseCaseRequest {
  title: string
  content?: string
  video_url?: string
  journeySlug: string
  plantId?: string
  moduleSlug: string
}
export class CreateLessonsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepositoty: LessonsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepositoty: LessonsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepositoty = lessonsRepositoty
  }
  async execute({
    title,
    content,
    video_url,
    journeySlug,
    plantId,
    moduleSlug,
  }: CreateLessonsUseCaseRequest) {
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
      moduleSlug,
      existingJourney.id,
    )

    if (!existingModules) {
      throw new NotFoundError('Módulo não encontrado!')
    }

    const existingLessons = await this.lessonsRepositoty.findBySlugAndModuleId(
      slug,
      existingModules.id
    )

    if (existingLessons) {
      throw new LessonsAlreadyExistsError()
    }

    const nextOrder = await this.lessonsRepositoty.nextOrder(existingModules.id)

    const lesson = await this.lessonsRepositoty.create({
      title,
      slug,
      content,
      order: nextOrder,
      pdf_url: null,
      video_url,
      moduleId: existingModules.id
    })

    return {
      lesson,
    }
  }
}
