import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
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
  order?: number
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
    order,
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
      throw new NotFoundError('Trilha não encontrada!')
    }

    const module = await this.modulesRepository.findBySlugAndJourneyId(
      moduleSlug,
      journey.id,
    )

    if(!module) {
      throw new NotFoundError('Módulo não encontrado!')
    }

    const lessonExists = await this.lessonsRepository.findByIdAndModuleId(id,module.id)

    if(!lessonExists) {
      throw new NotFoundError('Aula não encontrado!')
    }

    let slug: string | undefined

    if (title) {
      slug = createSlug(title)

      const existingLesson =
        await this.lessonsRepository.findBySlugAndModuleId(slug,module.id)

      if (existingLesson) {
        throw new LessonsAlreadyExistsError()
      }
    }

    const lesson = await this.lessonsRepository.edit({
      id,
      content,
      order,
      slug,
      title,
      video_url
    })

    if(!lesson){
          throw new GenericEditingError('Aula pôde ser atualizada.')
        }


    return {
      lesson,
    }
  }
}
