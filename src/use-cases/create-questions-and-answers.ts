import { ExamAnswersLimitError } from '../_erros/exam-answers-limit-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { InvalidCorrectExamAnswerError } from '../_erros/invalid-correct-exam-answer-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamAnswersRepository } from '../repositories/exam-answers-repository.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface CreateQuestionsAndAnswersUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examId: string
  title: string

  answers: {
    title: string
    isCorrect: boolean
  }[]
}
export class CreateQuestionsAndAnswersUseCase {
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
    examId,
    title,
    answers,
  }: CreateQuestionsAndAnswersUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

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

    const existingExam = await this.examsRepository.findByIdAndModuleId(
      examId,
      existingModules.id,
    )

    if (!existingExam) {
      throw new ExamsNotFoundError()
    }

    if (answers.length < 2 || answers.length > 5) {
      throw new ExamAnswersLimitError()
    }

    const answersCorrect = answers.filter((item) => item.isCorrect === true)

    if (answersCorrect.length !== 1) {
      throw new InvalidCorrectExamAnswerError()
    }

    const nextOrderQuestion = await this.examQuestionsRepository.nextOrder(
      existingExam.id,
    )

    const question = await this.examQuestionsRepository.create({
      title,
      order: nextOrderQuestion,
      examId: existingExam.id,
    })

    const answersWithOrder = answers.map((answer, index) => ({
      ...answer,
      order: index + 1,
      questionId: question.id,
    }))

    const createdAnswers =
      await this.examAnswersRepository.createMany(answersWithOrder)

    return {
      question,
      createdAnswers,
    }
  }
}
