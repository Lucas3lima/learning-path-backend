import type {
  CreateModuleContentsInput,
  ModuleContents,
  ModuleContentsRepository,
} from '../module-contents-repository.ts'

export class InMemoryModuleContentsRepository
  implements ModuleContentsRepository
{
  public items: ModuleContents[] = []

  async findById(id: string) {
    const mContent = this.items.find((item) => item.id === id)

    if (!mContent) {
      return null
    }

    return mContent
  }
  async findByModuleId(moduleId: string) {
    return this.items.filter((item) => item.moduleId === moduleId)
  }

  async findByIdAndModuleId(id: string, moduleId: string) {
    const mContent = this.items.find(
      (item) => item.id === id && item.moduleId === moduleId,
    )

    if (!mContent) {
      return null
    }

    return mContent
  }
  async create(data: CreateModuleContentsInput) {
    const mContent = {
      id: data.id ?? crypto.randomUUID(),
      moduleId: data.moduleId,
      type: data.type,
      lessonId: data.lessonId ?? null,
      examId: data.examId ?? null,
      order: data.order,

      created_at: new Date(),
    }

    this.items.push(mContent)

    return mContent
  }

  async delete(id: string) {
    const index = this.items.findIndex((item) => item.id === id)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }

  async nextOrder(moduleId: string) {
    const modules = this.items.filter((item) => item.moduleId === moduleId)

    if (modules.length === 0) {
      return 1
    }

    const maxOrder = Math.max(...modules.map((m) => m.order ?? 0))

    return maxOrder + 1
  }
}
