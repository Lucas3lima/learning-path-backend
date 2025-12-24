import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface ListModuleContentUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
}
interface ListModuleContentUseCaseResponse {
  id: string
  title: string
  slug: string
  order: number
  description: string | null
  content: string | null
  video_url: string | null
  pdf_url: string | null
  type: 'lesson' | 'exam'
}
export class ListModuleContentsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonsRepository: LessonsRepository
  private examsRepository: ExamsRepository
  private moduleContentsRepository: ModuleContentsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonsRepository: LessonsRepository,
    examsRepository: ExamsRepository,
    moduleContentsRepository: ModuleContentsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonsRepository = lessonsRepository
    this.examsRepository = examsRepository
    this.moduleContentsRepository = moduleContentsRepository
  }
  async execute({
    plantId,
    journeySlug,
    moduleSlug,
  }: ListModuleContentUseCaseRequest): Promise<
    ListModuleContentUseCaseResponse[]
  > {
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

    if (!module) {
      throw new NotFoundError('Módulo não encontrado!')
    }

    const moduleContents = await this.moduleContentsRepository.findByModuleId(module.id)


    const lessonIds = moduleContents
      .filter((item) => item.type === 'lesson' && item.lessonId)
      .map(
        (item) => item.lessonId!
      )

      const examIds = moduleContents
      .filter((item) => item.type === 'exam' && item.examId)
      .map((item) => item.examId!)
      
      const lessons = lessonIds.length ? await this.lessonsRepository.findManyByIds(lessonIds) : []
      
      const exams  = lessonIds.length ? await this.examsRepository.findManyByIds(examIds) : []
      
      const lessonsMap = new Map(lessons.map((l) => [l.id, l]))
      const examsMap = new Map(exams.map((e) => [e.id, e]))

    const contents: ListModuleContentUseCaseResponse[] = moduleContents.map(
      (item) => {
        if (item.type === 'lesson') {
          const lesson = lessonsMap.get(item.lessonId!)

          if (!lesson) {
            throw new LessonsNotFoundError()
          }

          return {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            description: null,
            content: lesson.content,
            video_url: lesson.video_url,
            pdf_url: lesson.pdf_url,
            order: item.order,
            type: 'lesson',
          }
        }

        const exam = examsMap.get(item.examId!)

        if (!exam) {
          throw new ExamsNotFoundError()
        }

        return {
          id: exam.id,
          title: exam.title,
          slug: exam.slug,
          description: exam.description,
          content: null,
          video_url: null,
          pdf_url: null,
          order: item.order,
          type: 'exam',
        }
      },
    )

    return contents.sort((a, b) => a.order - b.order)

  }
}
