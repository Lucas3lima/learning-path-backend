import { ExamsAlreadyExistsError } from '../_erros/exams-already-exists-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface EditExamsUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  id: string
  title?: string
  description?: string
}

export class EditExamsUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
  }
  async execute({
    id,
    title,
    description,
    plantId,
    journeySlug,
    moduleSlug,
  }: EditExamsUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const journey = await this.journeysRepository.findBySlugAndPlant(journeySlug,plantId)

    if(!journey){
      throw new JourneysNotFoundError()
    }

    const module = await this.modulesRepository.findBySlugAndJourneyId(moduleSlug,journey.id)

    if(!module){
      throw new ModulesNotFoundError()
    }

    const exams = await this.examsRepository.findByIdAndModuleId(id,module.id)
    
    if(!exams){
      throw new ExamsNotFoundError()
    }
    
    let slug: string | undefined

    if (title) {
      slug = createSlug(title)

      const existingExams = await this.examsRepository.findBySlugAndModuleId(
        slug,
        module.id,
      )

      if (existingExams) {
        throw new ExamsAlreadyExistsError()
      }
    }

    const exam = await this.examsRepository.edit({
      id,
      title,
      slug,
      description,
    })

    if (!exam) {
      throw new GenericEditingError(
        'Prova não pôde ser atualizada.',
      )
    }

    return {
      exam,
    }
  }
}
