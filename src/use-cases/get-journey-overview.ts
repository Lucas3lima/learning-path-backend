import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import { UsersNotFoundError } from '../_erros/users-not-found-error.ts'
import type { ExamAttemptsRepository } from '../repositories/exam-attempts-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { JourneysSectorsRepository } from '../repositories/journeys-sectors-repository.ts'
import type { LessonProgressRepository } from '../repositories/lesson-progress-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface GetJourneyOverviewUseCaseRequest {
  plantId?: string
  slug: string
  userId: string
}

interface GetJourneyOverviewUseCaseResponse {
  id: string
  title: string
  description: string | null
  level: string
  thumbnail_url: string | null
  sectors: {
    id: string
    name: string
  }[]
  responsible: {
    id: string
    name: string | null
    email: string
  }
  modules: {
    id: string
    title: string
    order: number
    slug: string
    hour: number
    description: string | null
    totalLessons: number
    totalExams: number
    totalCompleted: number
    progress: number
  }[]
  totalHours: number
  totalModules: number
  progress: number
  completed: boolean
}

export class GetJourneyOverviewUseCase {
  private usersRepository: UsersRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private journeysSectorsRepository: JourneysSectorsRepository
  private lessonsRepository: LessonsRepository
  private examsRepository: ExamsRepository
  private moduleContentsRepository: ModuleContentsRepository
  private lessonProgressRepository: LessonProgressRepository
  private examAttemptsRepository: ExamAttemptsRepository

  constructor(
    usersRepository: UsersRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    journeysSectorsRepository: JourneysSectorsRepository,
    lessonsRepository: LessonsRepository,
    examsRepository: ExamsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    lessonProgressRepository: LessonProgressRepository,
    examAttemptsRepository: ExamAttemptsRepository,
  ) {
    this.usersRepository = usersRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.journeysSectorsRepository = journeysSectorsRepository
    this.lessonsRepository = lessonsRepository
    this.examsRepository = examsRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.lessonProgressRepository = lessonProgressRepository
    this.examAttemptsRepository = examAttemptsRepository
  }

  async execute({
    plantId,
    slug,
    userId,
  }: GetJourneyOverviewUseCaseRequest): Promise<GetJourneyOverviewUseCaseResponse> {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    if (!userId) {
      throw new UsersNotFoundError()
    }

    // 1️⃣ Buscar a journey pelo slug e plantId
    const journey = await this.journeysRepository.findBySlugAndPlant(
      slug,
      plantId,
    )
    if (!journey) {
      throw new JourneysNotFoundError()
    }

    // 2️⃣ Buscar responsável
    const responsible = await this.usersRepository.findById(
      journey.responsibleId,
    )

    // 3️⃣ Buscar módulos ordenados
    const journeyModules = await this.modulesRepository.findByJourneyId(
      journey.id,
    )

    // 4️⃣ Buscar setores vinculados
    const journeySectorsResult =
      await this.journeysSectorsRepository.findAllJourneyId(journey.id)

    // 5️⃣ Enriquecer cada módulo com número de lessons e soma de horas das lessons
    const modules = await Promise.all(
      journeyModules.map(async (m) => {
        const lessons = await this.lessonsRepository.findByModuleId(m.id)
        const exams = await this.examsRepository.findByModuleId(m.id)
        const totalLessons = lessons.length
        const totalExams = exams.length

        const lessonIds = lessons.map((l) => l.id!)
        const lessonsCompleted = await this.lessonProgressRepository.findManyByUserAndLessonIds(userId,lessonIds)

        const examIds = exams.map((e) => e.id!)
        const examsCompleted = await this.examAttemptsRepository.findManyFinishedByUserAndExamIds(userId,examIds)

        const totalCompleted = lessonsCompleted.length + examsCompleted.length

        const progress =
          totalCompleted === 0
            ? 0
            : Math.round((totalCompleted / (lessons.length + exams.length )) * 100)

        

        return {
          id: m.id,
          title: m.title,
          order: m.order,
          slug: m.slug,
          hour: m.hour,
          description: m.description,
          totalLessons,
          totalExams,
          totalCompleted,
          progress
        }
      }),
    )

    // 6️⃣ Calcular métricas do journey
    const totalHours = journeyModules.reduce((acc, m) => acc + m.hour, 0)
    const totalModules = modules.length

    //7. progresso
    const allContents = []
    for (const module of journeyModules) {
      const contents = await this.moduleContentsRepository.findByModuleId(
        module.id,
      )
      allContents.push(...contents)
    }

    const lessonContents = allContents.filter((c) => c.type === 'lesson')
    const examContents = allContents.filter((c) => c.type === 'exam')

    const totalContents = lessonContents.length + examContents.length

    const completedLessons =
      await this.lessonProgressRepository.findManyCompletedByUserAndLessonIds(
        userId,
        lessonContents.map((c) => c.lessonId!),
      )

    const completedExams =
      await this.examAttemptsRepository.findManyFinishedByUserAndExamIds(
        userId,
        examContents.map((e) => e.examId!),
      )

    const completedCount = completedLessons.length + completedExams.length

    const progress =
      totalContents === 0
        ? 0
        : Math.round((completedCount / totalContents) * 100)

    const completed = progress === 100

    return {
      id: journey.id,
      title: journey.title,
      description: journey.description,
      level: journey.level,
      thumbnail_url: journey.thumbnail_url,

      responsible: {
        id: responsible?.id ?? '',
        name: responsible?.name ?? null,
        email: responsible?.email ?? '',
      },

      sectors: journeySectorsResult.map((s) => ({
        id: s.id,
        name: s.name,
      })),

      modules,
      totalHours,
      totalModules,
      progress,
      completed,
    }
  }
}
