import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface EditExamQuestionUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examSlug: string
  questionId: string
  title: string
}

export class EditExamQuestionUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  private examQuestionsRepository: ExamQuestionsRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
    examQuestionsRepository: ExamQuestionsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
    this.examQuestionsRepository = examQuestionsRepository
  }

  async execute({
    plantId,
    journeySlug,
    moduleSlug,
    examSlug,
    questionId,
    title,
  }: EditExamQuestionUseCaseRequest) {
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

    const exam = await this.examsRepository.findBySlugAndModuleId(
      examSlug,
      module.id,
    )

    if (!exam) {
      throw new ExamsNotFoundError()
    }

    const question = await this.examQuestionsRepository.findByIdAndExamId(
      questionId,
      exam.id,
    )

    if (!question) {
      throw new ExamsQuestionNotFoundError()
    }

    const questionEdited = await this.examQuestionsRepository.edit({
      id: question.id,
      title,
    })

    if (!questionEdited) {
      throw new GenericEditingError('Não foi possível editar a questão.')
    }

    return {
      questionEdited,
    }
  }
}
