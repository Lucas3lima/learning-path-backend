import type {
  CreateLessonsInput,
  EditLessonInput,
  Lessons,
  LessonsRepository,
} from '../lessons-repository.ts'

export class InMemoryLessonsRepository implements LessonsRepository {
  public items: Lessons[] = []

  async findById(id: string) {
    const lesson = this.items.find((item) => item.id === id)

    if (!lesson) {
      return null
    }

    return lesson
  }
  async findByModuleId(moduleId: string) {
    return this.items.filter((item) => item.moduleId === moduleId)
  }

  async findBySlugAndModuleId(slug: string, moduleId: string) {
    const lesson = this.items.find(
      (item) => item.slug === slug && item.moduleId === moduleId,
    )

    if (!lesson) {
      return null
    }

    return lesson
  }
  async findByIdAndModuleId(id: string, moduleId: string) {
    const lesson = this.items.find(
      (item) => item.id === id && item.moduleId === moduleId,
    )

    if (!lesson) {
      return null
    }

    return lesson
  }
  async create(data: CreateLessonsInput) {
    const lesson = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      moduleId: data.moduleId,
      pdf_url: data.pdf_url ?? null,
      video_url: data.video_url ?? null,
      content: data.content ?? null,

      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(lesson)

    return lesson
  }

  async edit(data: EditLessonInput) {
    const lessonIndex = this.items.findIndex((item) => item.id === data.id)

    if (lessonIndex === -1) {
      return null
    }

    const lesson = this.items[lessonIndex]

    const updatedLesson: Lessons = {
      ...lesson,
      title: data.title ?? lesson.title,
      slug: data.slug ?? lesson.slug,
      content: data.content ?? lesson.content,
      video_url: data.video_url ?? lesson.video_url,
      pdf_url: data.pdf_url ?? lesson.pdf_url,
      updated_at: new Date(),
    }
    this.items[lessonIndex] = updatedLesson

    return updatedLesson
  }
  async delete(id: string) {
    const index = this.items.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }
}
