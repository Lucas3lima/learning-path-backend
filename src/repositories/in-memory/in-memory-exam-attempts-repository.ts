import type {
    CreateExamAttemptsInput,
    ExamAttempts,
    ExamAttemptsRepository,
} from '../exam-attempts-repository.ts'

export class InMemoryExamAttemptsRepository implements ExamAttemptsRepository {
  public items: ExamAttempts[] = []

  async findActiveByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempts | null> {
    const attempt = this.items.find(
      (item) =>
        item.userId === userId &&
        item.examId === examId &&
        item.finished_at == null,
    )

    return attempt ?? null
  }

  async findFinishedByUserAndExam(
    userId: string,
    examId: string,
  ): Promise<ExamAttempts | null> {
    const attempt = this.items.find(
      (item) =>
        item.userId === userId &&
        item.examId === examId &&
        item.finished_at != null &&
        item.approved === true
        ,
    )

    return attempt ?? null
  }

  async create(data: CreateExamAttemptsInput): Promise<ExamAttempts> {
    const attempt: ExamAttempts = {
      id: data.id ?? crypto.randomUUID(),
      userId: data.userId,
      examId: data.examId,

      score: null,
      approved: null,

      started_at: new Date(),
      finished_at: null,
    }

    this.items.push(attempt)

    return attempt
  }

  async finishAttempt(
    attemptId: string,
    score: number,
    approved: boolean,
  ): Promise<void> {
    const attempt = this.items.find((item) => item.id === attemptId)

    if (!attempt) {
      return
    }

    attempt.score = score
    attempt.approved = approved
    attempt.finished_at = new Date()
  }

  async deleteByUserAndExam(userId: string, examId: string): Promise<boolean> {
    const index = this.items.findIndex(
      (item) => item.userId === userId && item.examId === examId,
    )

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)
    return true
  }

  async finishActiveAttemptAsFailed(
    userId: string,
    examId: string,
  ): Promise<void> {
    const attempt = this.items.find(
      (item) =>
        item.userId === userId &&
        item.examId === examId &&
        item.finished_at === null,
    )

    if (!attempt) {
      return
    }

    attempt.score = 0
    attempt.approved = false
    attempt.finished_at = new Date()
  }

}
