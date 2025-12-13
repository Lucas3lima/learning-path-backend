import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface ListModuleLessonsUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
}
interface ListModuleLessonsUseCaseResponse {
  id: string;
  title: string;
  slug: string;
  order: number | null;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
}
export class ListModuleLessonsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepository: LessonsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepository: LessonsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepository = lessonsRepository
  }
  async execute({
    plantId,
    journeySlug,
    moduleSlug
  }: ListModuleLessonsUseCaseRequest): Promise<ListModuleLessonsUseCaseResponse[]> {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const journey = await this.journeysRepository.findBySlugAndPlant(journeySlug,plantId)

    if(!journey){
        throw new NotFoundError('Trilha não encontrada!')
    }

    const module = await this.modulesRepository.findBySlugAndJourneyId(moduleSlug,journey.id)

    if(!module){
        throw new NotFoundError('Módulo não encontrado!')
    }

    const lessons = await this.lessonsRepository.findByModuleId(module.id)


    return lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        content: lesson.content,
        video_url: lesson.video_url,
        pdf_url: lesson.pdf_url,
    }))
  }
}
