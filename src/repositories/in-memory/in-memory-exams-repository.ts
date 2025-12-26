import type {
  CreateExamsInput,
  EditExamsInput,
  Exams,
  ExamsRepository,
} from '../exams-repository.ts'

export class InMemoryExamsRepository implements ExamsRepository {
  public items: Exams[] = []

  async findById(id: string) {
    const exam = this.items.find((item) => item.id === id)

    if (!exam) {
      return null
    }

    return exam
  }
  async findByModuleId(moduleId: string) {
    return this.items.filter((item) => item.moduleId === moduleId)
  }

  async findBySlugAndModuleId(slug: string, moduleId: string) {
    const exam = this.items.find(
      (item) => item.slug === slug && item.moduleId === moduleId,
    )

    if (!exam) {
      return null
    }

    return exam
  }
  async findByIdAndModuleId(id: string, moduleId: string) {
    const exam = this.items.find(
      (item) => item.id === id && item.moduleId === moduleId,
    )

    if (!exam) {
      return null
    }

    return exam
  }
  async create(data: CreateExamsInput) {
    const exam = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      moduleId: data.moduleId,

      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(exam)

    return exam
  }

  async edit(data: EditExamsInput) {
    const examsIndex = this.items.findIndex(
      (item) => item.id === data.id,
    )

    if (examsIndex === -1) {
      return null
    }

    const exam = this.items[examsIndex]

    const updatedExams: Exams = {
      ...exam,
      title: data.title ?? exam.title,
      slug: data.slug ?? exam.slug,
      description: data.description ?? exam.description,
      updated_at: new Date(),
    }

    this.items[examsIndex] = updatedExams

    return updatedExams
  }
  async delete(id: string) {
    const index = this.items.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }

  async findManyByIds(ids: string[]) {
    if (ids.length === 0) {
      return []
    }

    return this.items.filter((exam) => ids.includes(exam.id))
  }
}
