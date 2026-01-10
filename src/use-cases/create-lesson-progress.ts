import { ExamLockedError } from '../_erros/exam-locked-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonAlreadyCompletedError } from '../_erros/lesson-already-completed-error.ts'
import { LessonLockedError } from '../_erros/lesson-locked-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamAttemptsRepository } from '../repositories/exam-attempts-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonProgressRepository } from '../repositories/lesson-progress-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface CreateLessonProgressUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  lessonId: string
  userId: string
}
export class CreateLessonProgresssUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private lessonRepository: LessonsRepository
  private moduleContentsRepository: ModuleContentsRepository
  private lessonProgressRepository: LessonProgressRepository
  private examAttemptsRepository: ExamAttemptsRepository

  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonRepository: LessonsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    lessonProgressRepository: LessonProgressRepository,
    examAttemptsRepository: ExamAttemptsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonRepository = lessonRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.lessonProgressRepository = lessonProgressRepository
    this.examAttemptsRepository = examAttemptsRepository
  }
  async execute({
    plantId,
    journeySlug,
    moduleSlug,
    lessonId,
    userId,
  }: CreateLessonProgressUseCaseRequest) {
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

    const lesson = await this.lessonRepository.findByIdAndModuleId(
      lessonId,
      module.id,
    )

    if (!lesson) {
      throw new LessonsNotFoundError()
    }

    const moduleContents = await this.moduleContentsRepository.findByModuleId(
      module.id,
    )

    const lessonContent = moduleContents.find(
      (item) => item.type === 'lesson' && item.lessonId === lesson.id,
    )

    if (!lessonContent) {
      throw new LessonsNotFoundError()
    }

    // 🔒 verifica se já foi concluída
    const alreadyCompleted =
      await this.lessonProgressRepository.findByUserAndLesson(userId, lesson.id)
    if (alreadyCompleted) {
      throw new LessonAlreadyCompletedError()
    }

    const sortedContents = [...moduleContents].sort(
      (a, b) => a.order - b.order,
    )

    const lessonIndex = sortedContents.findIndex(
      (item) => item.type === 'lesson' && item.lessonId === lesson.id,
    )

    if (lessonIndex === -1) {
      throw new LessonsNotFoundError()
    }

    const previousContent = sortedContents[lessonIndex - 1]

    if (previousContent) {
      // 🔒 se o anterior for uma lesson
      if (previousContent.type === 'lesson') {
        const lessonCompleted =
          await this.lessonProgressRepository.findByUserAndLesson(
            userId,
            previousContent.lessonId!,
          )

        if (!lessonCompleted) {
          throw new LessonLockedError()
        }
      }

      // 🔒 se o anterior for uma prova
      if (previousContent.type === 'exam') {
        const examCompleted =
          await this.examAttemptsRepository.findFinishedByUserAndExam(
            userId,
            previousContent.examId!,
          )

        if (!examCompleted) {
          throw new ExamLockedError()
        }
      }
    }
    // ✅ cria progresso
    const progress = await this.lessonProgressRepository.create({
      userId,
      lessonId,
      completed: true,
    })

    return {
      progress,
    }
  }
}
