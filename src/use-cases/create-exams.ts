import { ExamsAlreadyExistsError } from '../_erros/exams-already-exists-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface CreateExamsUseCaseRequest {
  journeySlug: string
  moduleSlug: string
  plantId?: string
  title: string
  description?: string
}
export class CreateExamsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  private moduleContentsRepository: ModuleContentsRepository

  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
    moduleContentsRepository: ModuleContentsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
    this.moduleContentsRepository = moduleContentsRepository
  }
  async execute({
    journeySlug,
    moduleSlug,
    plantId,
    title,
    description,
  }: CreateExamsUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
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

    const existingExams = await this.examsRepository.findBySlugAndModuleId(
      slug,
      existingModules.id,
    )

    if (existingExams) {
      throw new ExamsAlreadyExistsError()
    }

    const exam = await this.examsRepository.create({
      title,
      slug,
      description,
      moduleId: existingModules.id,
    })

    const nextOrder = await this.moduleContentsRepository.nextOrder(
      existingModules.id,
    )

    const moduleContent = await this.moduleContentsRepository.create({
      moduleId: existingModules.id,
      type: 'exam',
      examId: exam.id,
      order: nextOrder,
    })

    return {
      exam,
      moduleContent,
    }
  }
}
