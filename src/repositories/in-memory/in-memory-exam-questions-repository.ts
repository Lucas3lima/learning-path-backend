import type {
  CreateExamQuestionsInput,
  EditExamQuestionsInput,
  ExamQuestions,
  ExamQuestionsRepository,
} from '../exam-questions-repository.ts'

export class InMemoryExamQuestionsRepository
  implements ExamQuestionsRepository
{
  public items: ExamQuestions[] = []

  async create(data: CreateExamQuestionsInput) {
    const question: ExamQuestions = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date(),
    }

    this.items.push(question)

    return question
  }

  async findById(id: string) {
    return this.items.find((item) => item.id === id) ?? null
  }
  async findByIdAndExamId(id: string, examId: string) {
    return this.items.find((item) => item.id === id && item.examId === examId) ?? null
  }

  async findByExamId(examId: string) {
    return this.items
      .filter((item) => item.examId === examId)
      .sort((a, b) => a.order - b.order)
  }

  async findByExamIdAndOrder(
    examId: string,
    order: number,
  ) {
    return (
      this.items.find(
        (item) => item.examId === examId && item.order === order,
      ) ?? null
    )
  }

  async edit(data: EditExamQuestionsInput) {
    const index = this.items.findIndex((item) => item.id === data.id)

    if (index === -1) {
      return null
    }

    const question = this.items[index]

    const updated: ExamQuestions = {
      ...question,
      title: data.title ?? question.title,
      order: data.order ?? question.order,
    }

    this.items[index] = updated

    return updated
  }

  async delete(id: string){
    const index = this.items.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }

  async nextOrder(examId: string) {
    const question = this.items.filter((item) => item.examId === examId)

    if (question.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...question.map((m) => m.order ?? 0))

    return maxOrder + 1
  }
}
