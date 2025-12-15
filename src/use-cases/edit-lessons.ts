import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface EditLessonsUseCaseRequest {
  id: string
  journeySlug: string
  moduleSlug: string
  plantId?: string
  title?: string
  content?: string
  video_url?: string
}

export class EditLessonsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepository: LessonsRepository

  constructor(
    modulesRepository: ModulesRepository,
    journeysRepository: JourneysRepository,
    lessonsRepository: LessonsRepository,
  ) {
    this.modulesRepository = modulesRepository
    this.journeysRepository = journeysRepository
    this.lessonsRepository = lessonsRepository
  }
  async execute({
    id,
    title,
    plantId,
    journeySlug,
    moduleSlug,
    content,
    video_url,
  }: EditLessonsUseCaseRequest) {
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

    const lessonExists = await this.lessonsRepository.findByIdAndModuleId(
      id,
      module.id,
    )

    if (!lessonExists) {
      throw new LessonsNotFoundError()
    }

    let slug: string | undefined

    if (title) {
      slug = createSlug(title)

      const existingLesson = await this.lessonsRepository.findBySlugAndModuleId(
        slug,
        module.id,
      )

      if (existingLesson) {
        throw new LessonsAlreadyExistsError()
      }
    }

    const lesson = await this.lessonsRepository.edit({
      id,
      content,
      slug,
      title,
      video_url,
    })

    if (!lesson) {
      throw new GenericEditingError('Aula pôde ser atualizada.')
    }

    return {
      lesson,
    }
  }
}
