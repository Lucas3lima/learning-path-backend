import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import { UsersNotFoundError } from '../_erros/users-not-found-error.ts'
import type { ExamAttemptsRepository } from '../repositories/exam-attempts-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { JourneysSectorsRepository } from '../repositories/journeys-sectors-repository.ts'
import type { LessonProgressRepository } from '../repositories/lesson-progress-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface GetAllJourneysUseCaseRequest {
  plantId?: string
  userId: string
}
interface GetAllJourneysUseCaseReponse {
  id: string
  title: string
  slug: string
  description: string | null
  level: string
  thumbnail_url: string | null
  visible: boolean
  sectors: {
    id: string
    name: string
  }[]
  responsible: {
    id: string
    name: string | null
    email: string
  }
  totalHours: number
  totalModules: number
  progress: number
  completed: boolean
}
export class GetAllJourneysUseCase {
  private usersRepository: UsersRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private journeysSectorsRepository: JourneysSectorsRepository
  private moduleContentsRepository: ModuleContentsRepository
  private lessonProgressRepository: LessonProgressRepository
  private examAttemptsRepository: ExamAttemptsRepository

  constructor(
    usersRepository: UsersRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    journeysSectorsRepository: JourneysSectorsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    lessonProgressRepository: LessonProgressRepository,
    examAttemptsRepository: ExamAttemptsRepository,
  ) {
    this.usersRepository = usersRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.journeysSectorsRepository = journeysSectorsRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.lessonProgressRepository = lessonProgressRepository
    this.examAttemptsRepository = examAttemptsRepository
  }
  async execute({
    plantId,
    userId
  }: GetAllJourneysUseCaseRequest): Promise<GetAllJourneysUseCaseReponse[]> {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    if(!userId) {
      throw new UsersNotFoundError()
    }

    const journeysResult = await this.journeysRepository.findByPlantId(plantId)

    if (journeysResult.length > 0) {
      const journeysResponse = await Promise.all(
        journeysResult.map(async (journey) => {
          // 1. Busca o responsável
          const responsible = await this.usersRepository.findById(
            journey.responsibleId,
          )
          // 2. modulos
          const journeyModules = await this.modulesRepository.findByJourneyId(
            journey.id,
          )
          // 3. setores
          const journeySectorsResult =
            await this.journeysSectorsRepository.findAllJourneyId(journey.id)

          const totalHours = journeyModules.reduce((acc, m) => acc + m.hour, 0)
          const totalModules = journeyModules.length

          //4. progresso
          const allContents = [] 
          for (const module of journeyModules) {
            const contents = await this.moduleContentsRepository.findByModuleId(
              module.id,
            )
            allContents.push(...contents)
          }

          const lessonContents = allContents.filter(c => c.type === 'lesson')
          const examContents = allContents.filter(c => c.type === 'exam')

          const totalContents = lessonContents.length + examContents.length

          const completedLessons = await this.lessonProgressRepository.findManyCompletedByUserAndLessonIds(
            userId,
            lessonContents.map(c => c.lessonId!)
          )

          const completedExams = await this.examAttemptsRepository.findManyFinishedByUserAndExamIds(
            userId,
            examContents.map(e => e.examId!)
          )


          const completedCount = completedLessons.length + completedExams.length

          const progress = totalContents === 0 ? 0 : Math.round((completedCount/totalContents) * 100)

          const completed = progress === 100
          return {
            id: journey.id,
            title: journey.title,
            slug: journey.slug,
            description: journey.description,
            level: journey.level,
            thumbnail_url: journey.thumbnail_url,
            visible: journey.visible,

            responsible: {
              id: responsible?.id ?? '',
              name: responsible?.name ?? null,
              email: responsible?.email ?? '',
            },

            sectors: journeySectorsResult.map((s) => ({
              id: s.id,
              name: s.name,
            })),

            totalHours,
            totalModules,
            progress,
            completed
          }
        }),
      )
      return journeysResponse
    }
    return []
  }
}
