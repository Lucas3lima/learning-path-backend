import { DuplicateExamQuestionAnswerError } from '../_erros/duplicate-exam-question-answer-error.ts'
import { ExamAlreadyCompletedError } from '../_erros/exam-already-completed-error.ts'
import { ExamNotStartedError } from '../_erros/exam-not-started-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { IncompleteExamError } from '../_erros/incomplete-exam-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type {
  ExamAnswersRepository
} from '../repositories/exam-answers-repository.ts'
import type { ExamAttemptsRepository } from '../repositories/exam-attempts-repository.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface FinishExamUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examId: string
  userId: string
  answers: {
    questionId: string
    answerId: string
  }[]
}

export class FinishExamUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  private moduleContentsRepository: ModuleContentsRepository
  private examQuestionsRepository: ExamQuestionsRepository
  private examAnswersRepository: ExamAnswersRepository
  private examAttemptsRepository: ExamAttemptsRepository

  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    examQuestionsRepository: ExamQuestionsRepository,
    examAnswersRepository: ExamAnswersRepository,
    examAttemptsRepository: ExamAttemptsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.examQuestionsRepository = examQuestionsRepository
    this.examAnswersRepository = examAnswersRepository
    this.examAttemptsRepository = examAttemptsRepository
  }
  async execute({
    plantId,
    journeySlug,
    moduleSlug,
    examId,
    userId,
    answers
  }: FinishExamUseCaseRequest) {
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

    const exam = await this.examsRepository.findByIdAndModuleId(
      examId,
      module.id,
    )

    if (!exam) {
      throw new ExamsNotFoundError()
    }

    const moduleContents = await this.moduleContentsRepository.findByModuleId(
      module.id,
    )

    const sortedContents = moduleContents.sort((a, b) => a.order - b.order)

    const examIndex = sortedContents.findIndex(
      (item) => item.type === 'exam' && item.examId === exam.id,
    )

    if (examIndex === -1) {
      throw new ExamsNotFoundError()
    }

    // 🔒 1. verifica se já foi concluída
    const alreadyCompleted =
      await this.examAttemptsRepository.findFinishedByUserAndExam(
        userId,
        exam.id,
      )

    if (alreadyCompleted) {
      throw new ExamAlreadyCompletedError()
    }

    // 🔒 2. existe tentativa ativa?
    const activeAttempt =
      await this.examAttemptsRepository.findActiveByUserAndExam(userId, exam.id)

    if (!activeAttempt) {
      throw new ExamNotStartedError()
    }

    // 3️⃣ carrega perguntas e respostas corretas
    const questions = await this.examQuestionsRepository.findByExamId(exam.id)

    // se não tiver questões já retorna o erro
    if (questions.length === 0) {
      throw new ExamsQuestionNotFoundError()
    }

    const questionIds = questions.map((q) => q.id)

    const correctAnswers =
      await this.examAnswersRepository.findManyCorrectByQuestionIds(questionIds)

    const correctByQuestion = new Map<string, string>()

    for (const answer of correctAnswers) {
      correctByQuestion.set(answer.questionId, answer.id)
    }

    // 4️⃣ validação + correção segura

    const validQuestionIds = new Set(questions.map(q => q.id))
    const answeredQuestions = new Set<string>()

    let correctCount = 0
    const results: {
      questionId: string
      selectedAnswerId: string
      correctAnswerId: string
      isCorrect: boolean
    }[] = []


    for (const userAnswer of answers) {
      // ❌ pergunta não pertence à prova
      if (!validQuestionIds.has(userAnswer.questionId)) {
        throw new ExamsQuestionNotFoundError()
      }

      // ❌ pergunta duplicada
      if (answeredQuestions.has(userAnswer.questionId)) {
        throw new DuplicateExamQuestionAnswerError()
      }

      answeredQuestions.add(userAnswer.questionId)

      const correctAnswerId = correctByQuestion.get(userAnswer.questionId)

      // ❌ erro de sistema (prova mal cadastrada)
      if (!correctAnswerId) {
        throw new ExamsQuestionNotFoundError()
      }

      const isCorrect = correctAnswerId === userAnswer.answerId
      if (isCorrect) {
        correctCount++
      }
      results.push({
        questionId: userAnswer.questionId,
        selectedAnswerId: userAnswer.answerId,
        correctAnswerId,
        isCorrect,
      })
    }

    // ❌ não respondeu todas as perguntas
    if (answeredQuestions.size !== questions.length) {
      throw new IncompleteExamError()
    }


    const totalQuestions = questions.length
    const score = Math.round(
      (correctCount / totalQuestions) * 100
    )
    const approved = score >= 80 // ex: 70

    await this.examAttemptsRepository.finishAttempt(
      activeAttempt.id,
      score,
      approved,
    )

    if (!approved) {
      return {
        score,
        approved,
        totalQuestions,
        correctAnswers: correctCount,
      }
    }

    return {
      score,
      approved,
      totalQuestions,
      correctAnswers: correctCount,
      results, // 👈 só se aprovado
    }

  }
}
