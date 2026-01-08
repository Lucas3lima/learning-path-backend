import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonAlreadyCompletedError } from '../_erros/lesson-already-completed-error.ts'
import { LessonLockedError } from '../_erros/lesson-locked-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
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

  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    lessonRepository: LessonsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    lessonProgressRepository: LessonProgressRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.lessonRepository = lessonRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.lessonProgressRepository = lessonProgressRepository
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

    const journey  = await this.journeysRepository.findBySlugAndPlant(
      journeySlug,
      plantId,
    )

    if (!journey ) {
      throw new JourneysNotFoundError()
    }

    const module  = await this.modulesRepository.findBySlugAndJourneyId(
      moduleSlug,
      journey.id,
    )

    if (!module ) {
      throw new ModulesNotFoundError()
    }

    const lesson = await this.lessonRepository.findByIdAndModuleId(lessonId,module.id)

    if(!lesson){
      throw new LessonsNotFoundError()
    }

    const moduleContents = await this.moduleContentsRepository.findByModuleId(module.id)

    const lessonContent = moduleContents.find(
      (item) => item.type === 'lesson' && item.lessonId === lesson.id
    )

    if(!lessonContent){
      throw new LessonsNotFoundError()
    }

    // 🔒 verifica se já foi concluída
    const alreadyCompleted = await this.lessonProgressRepository.findByUserAndLesson(userId,lesson.id)
    console.log(alreadyCompleted)
    if(alreadyCompleted){
      throw new LessonAlreadyCompletedError()
    }

    const previousLesson = moduleContents
      .filter((item) => item.type === 'lesson')
      .sort((a,b) => a.order - b.order)
      .find((item) => item.order === lessonContent.order - 1)

    
    if(previousLesson) {
      const previousCompleted =
        await this.lessonProgressRepository.findByUserAndLesson(
          userId,
          previousLesson.lessonId!,
        )

      
      if (!previousCompleted) {
        throw new LessonLockedError()
      }
    }

    // ✅ cria progresso
    const progress = await this.lessonProgressRepository.create({
      userId,
      lessonId,
      completed: true,
    })

    return {
      progress
    }
  }
}
