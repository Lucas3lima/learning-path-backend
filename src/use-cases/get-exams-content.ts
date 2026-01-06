import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { ExamAnswersRepository } from '../repositories/exam-answers-repository.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface GetExamsContentUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examSlug: string
}
export interface GetExamsContentUseCaseResponse {
  exam: {
    id: string
    title: string
    slug: string
  }
  questions: {
    id: string
    title: string
    order: number
    answers: {
      id: string
      title: string
      order: number
      isCorrect: boolean
    }[]
  }[]
}

export class GetExamsContentUseCase {
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
  }: GetExamsContentUseCaseRequest): Promise<GetExamsContentUseCaseResponse> {
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

    const questions = await this.examQuestionsRepository.findByExamId(exam.id)

    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answers = await this.examAnswersRepository.findByQuestionId(
          question.id,
        )

        return {
          id: question.id,
          title: question.title,
          order: question.order,
          answers: answers
            .sort((a, b) => a.order - b.order)
            .map((answer) => ({
              id: answer.id,
              title: answer.title,
              order: answer.order,
              isCorrect: answer.isCorrect,
            })),
        }
      }),
    )

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        slug: exam.slug,
      },
      questions: questionsWithAnswers.sort((a, b) => a.order - b.order),
    }
  }
}
