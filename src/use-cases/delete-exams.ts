import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface DeleteExamsUseCaseRequest {
  id: string
  journeySlug: string
  moduleSlug: string
  plantId?: string
}

export class DeleteExamsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
  }

  async execute({
    id,
    plantId,
    journeySlug,
    moduleSlug,
  }: DeleteExamsUseCaseRequest) {
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

    const exam = await this.examsRepository.findByIdAndModuleId(id, module.id)

    if (!exam) {
      throw new ExamsNotFoundError()
    }

    const deleted = await this.examsRepository.delete(id)

    if (!deleted) {
      throw new GenericDeletingError('Prova não pôde ser deletada.')
    }

    return {
      deleted,
    }
  }
}
