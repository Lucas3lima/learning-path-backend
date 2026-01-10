import { ExamAlreadyCompletedError } from '../_erros/exam-already-completed-error.ts'
import { ExamLockedError } from '../_erros/exam-locked-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonLockedError } from '../_erros/lesson-locked-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type {
  ExamAnswers,
  ExamAnswersRepository,
} from '../repositories/exam-answers-repository.ts'
import type { ExamAttemptsRepository } from '../repositories/exam-attempts-repository.ts'
import type { ExamQuestionsRepository } from '../repositories/exam-questions-repository.ts'
import type { ExamsRepository } from '../repositories/exams-repository.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { LessonProgressRepository } from '../repositories/lesson-progress-repository.ts'
import type { ModuleContentsRepository } from '../repositories/module-contents-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'

interface StartExamUseCaseRequest {
  plantId?: string
  journeySlug: string
  moduleSlug: string
  examId: string
  userId: string
}
export class StartExamUseCase {
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private examsRepository: ExamsRepository
  private moduleContentsRepository: ModuleContentsRepository
  private examQuestionsRepository: ExamQuestionsRepository
  private examAnswersRepository: ExamAnswersRepository
  private lessonProgressRepository: LessonProgressRepository
  private examAttemptsRepository: ExamAttemptsRepository

  constructor(
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    examsRepository: ExamsRepository,
    moduleContentsRepository: ModuleContentsRepository,
    examQuestionsRepository: ExamQuestionsRepository,
    examAnswersRepository: ExamAnswersRepository,
    lessonProgressRepository: LessonProgressRepository,
    examAttemptsRepository: ExamAttemptsRepository,
  ) {
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.examsRepository = examsRepository
    this.moduleContentsRepository = moduleContentsRepository
    this.examQuestionsRepository = examQuestionsRepository
    this.examAnswersRepository = examAnswersRepository
    this.lessonProgressRepository = lessonProgressRepository
    this.examAttemptsRepository = examAttemptsRepository
  }
  async execute({
    plantId,
    journeySlug,
    moduleSlug,
    examId,
    userId,
  }: StartExamUseCaseRequest) {
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

    // 🔒 2. conteúdo anterior precisa estar concluído
    const previousContent = sortedContents[examIndex - 1]

    if (previousContent) {
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

    // 🔒 3. já existe tentativa ativa?
    const activeAttempt =
      await this.examAttemptsRepository.findActiveByUserAndExam(userId, exam.id)

    if (activeAttempt) {
      await this.examAttemptsRepository.finishActiveAttemptAsFailed(userId,examId)
    }

    // ✅ cria tentativa
    const attempt = await this.examAttemptsRepository.create({
      userId,
      examId: exam.id,
    })

    // 📦 carrega questões + respostas
    const questions = await this.examQuestionsRepository.findByExamId(exam.id)

    // se não tiver questões já retorna o erro
    if (questions.length === 0) {
      throw new ExamsQuestionNotFoundError()
    }

    const questionIds = questions.map((q) => q.id)

    const answers =
      questionIds.length > 0
        ? await this.examAnswersRepository.findManyByQuestionIds(questionIds)
        : []

    const answersByQuestion = new Map<string, ExamAnswers[]>()

    for (const answer of answers) {
      const list = answersByQuestion.get(answer.questionId) ?? []
      list.push(answer)
      answersByQuestion.set(answer.questionId, list)
    }

    return {
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
      },
      questions: questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          title: q.title,
          order: q.order,
          answers: (answersByQuestion.get(q.id) ?? [])
            .sort((a, b) => a.order - b.order)
            .map((a) => ({
              id: a.id,
              title: a.title,
              order: a.order,
            })),
        })),
    }
  }
}
