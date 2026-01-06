import { ExamAnswersLimitError } from '../_erros/exam-answers-limit-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { InvalidCorrectExamAnswerError } from '../_erros/invalid-correct-exam-answer-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamAnswersRepository } from '../repositories/exam-answers-repository.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface EditExamAnswersUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examSlug: string
  questionId: string
  answers: {
    title: string
    isCorrect: boolean
  }[]
}

export class EditExamAnswersUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  private examQuestionsRepository: ExamQuestionsRepository
  private examAnswersRepository: ExamAnswersRepository
  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
    examQuestionsRepository: ExamQuestionsRepository,
    examAnswersRepository: ExamAnswersRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
    this.examQuestionsRepository = examQuestionsRepository
    this.examAnswersRepository = examAnswersRepository
  }

  async execute({
    plantId,
    journeySlug,
    moduleSlug,
    examSlug,
    questionId,
    answers,
  }: EditExamAnswersUseCaseRequest) {
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

    if (answers.length < 2 || answers.length > 5) {
      throw new ExamAnswersLimitError()
    }

    const answersCorrect = answers.filter((item) => item.isCorrect === true)

    if (answersCorrect.length !== 1) {
      throw new InvalidCorrectExamAnswerError()
    }

    const deleted = await this.examAnswersRepository.deleteByQuestionId(
      question.id,
    )

    if (!deleted) {
      throw new GenericDeletingError(
        'Não foi possível deletar as respostas da questão.',
      )
    }

    const answersWithOrder = answers.map((answer, index) => ({
      ...answer,
      order: index + 1,
      questionId: question.id,
    }))

    const createdAnswers =
      await this.examAnswersRepository.createMany(answersWithOrder)

    return {
      createdAnswers,
    }
  }
}
