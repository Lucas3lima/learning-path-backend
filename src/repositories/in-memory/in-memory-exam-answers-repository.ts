import type {
  CreateExamAnswersInput,
  EditExamAnswersInput,
  ExamAnswers,
  ExamAnswersRepository,
} from '../exam-answers-repository.ts'

export class InMemoryExamAnswersRepository implements ExamAnswersRepository {
  public items: ExamAnswers[] = []
  
  async findManyByQuestionIds(
    questionIds: string[],
  ): Promise<ExamAnswers[]> {
    return this.items.filter((answer) =>
      questionIds.includes(answer.questionId),
    )
  }
  async createMany(data: CreateExamAnswersInput[]) {
    const answers = data.map((answer) => ({
      id: answer.id ?? crypto.randomUUID(),
      title: answer.title,
      questionId: answer.questionId,
      order: answer.order,
      isCorrect: answer.isCorrect ?? false, // ✅ AQUI
      created_at: new Date(),
    }))

    this.items.push(...answers)

    return answers
  }
  async findManyCorrectByQuestionIds(
    questionIds: string[],
  ): Promise<ExamAnswers[]> {
    return this.items.filter(
      (answer) =>
        questionIds.includes(answer.questionId) &&
        answer.isCorrect === true,
    )
  }

  async findByQuestionId(questionId: string): Promise<ExamAnswers[]> {
    return this.items
      .filter((item) => item.questionId === questionId)
      .sort((a, b) => a.order - b.order)
  }

  async edit(data: EditExamAnswersInput): Promise<ExamAnswers | null> {
    const index = this.items.findIndex((item) => item.id === data.id)

    if (index === -1) {
      return null
    }

    const answer = this.items[index]

    const updated: ExamAnswers = {
      ...answer,
      title: data.title ?? answer.title,
      isCorrect: data.isCorrect ?? answer.isCorrect,
      order: data.order ?? answer.order,
    }

    this.items[index] = updated

    return updated
  }

  async deleteByQuestionId(questionId: string): Promise<boolean> {
    const initialLength = this.items.length

    this.items = this.items.filter((item) => item.questionId !== questionId)

    return this.items.length < initialLength
  }

  async nextOrder(questionId: string) {
    const answer = this.items.filter((item) => item.questionId === questionId)

    if (answer.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...answer.map((m) => m.order ?? 0))

    return maxOrder + 1
  }
}
