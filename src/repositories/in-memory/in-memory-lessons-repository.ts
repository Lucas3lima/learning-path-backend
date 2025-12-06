import type { CreateLessonsInput, Lessons, LessonsRepository } from '../lessons-repository.ts'

export class InMemoryLessonsRepository implements LessonsRepository {
  public items: Lessons[] = []

  async findById(id: string) {
    const lesson = this.items.find((item) => item.id === id)

    if (!lesson) {
      return null
    }

    return lesson
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
  async create(data: CreateLessonsInput) {
    const module = {
      id: data.id ?? crypto.randomUUID(),
      title: data.title,
      slug: data.slug,
      moduleId: data.moduleId,
      order: data.order ?? 1,
      pdf_url: data.pdf_url ?? null,
      video_url: data.video_url ?? null,
      content: data.content ?? null,
    
      created_at: new Date(),
      updated_at: new Date(),
    }

    this.items.push(module)

    return module
  }

  async nextOrder(moduleId: string) {
    const lessons = this.items.filter((item) => item.moduleId === moduleId)

    if (lessons.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...lessons.map((m) => m.order ?? 0))

    return maxOrder + 1
  }
}
