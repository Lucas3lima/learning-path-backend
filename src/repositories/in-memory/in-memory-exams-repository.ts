import type { CreateExamsInput, Exams, ExamsRepository } from '../exams-repository.ts'

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

  // async edit(data: EditLessonInput) {
  //   const lessonIndex = this.items.findIndex((item) => item.id === data.id)

  //   if (lessonIndex === -1) {
  //     return null
  //   }

  //   const lesson = this.items[lessonIndex]

  //   const updatedLesson: Lessons = {
  //     ...lesson,
  //     title: data.title ?? lesson.title,
  //     slug: data.slug ?? lesson.slug,
  //     content: data.content ?? lesson.content,
  //     video_url: data.video_url ?? lesson.video_url,
  //     pdf_url: data.pdf_url ?? lesson.pdf_url,
  //     updated_at: new Date(),
  //   }
  //   this.items[lessonIndex] = updatedLesson

  //   return updatedLesson
  // }
  async delete(id: string) {
    const index = this.items.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }

  async findManyByIds(ids: string[]){

    if(ids.length === 0){
      return []
    }

    return this.items.filter((exam) => ids.includes(exam.id))

  }
}
