import type {
  CreateLessonProgressInput,
  LessonProgress,
  LessonProgressRepository,
} from '../lesson-progress-repository.ts'

export class InMemoryLessonProgressRepository
  implements LessonProgressRepository
{
  public items: LessonProgress[] = []

  async findByUserAndLesson(userId: string, lessonId: string) {
    const progress = this.items.find(
      (item) => item.userId === userId && item.lessonId === lessonId,
    )

    return progress ?? null
  }

   async findManyByUserAndLessonIds(
    userId: string,
    lessonIds: string[],
  ) {
    return this.items.filter(
      (item) =>
        item.userId === userId &&
        lessonIds.includes(item.lessonId),
    )
  }

  async create(data: CreateLessonProgressInput) {
    const progress = {
      id: data.id ?? crypto.randomUUID(),
      userId: data.userId,
      lessonId: data.lessonId,
      completed: data.completed ?? true,

      completed_at: new Date(),
    }

    this.items.push(progress)

    return progress
  }


  async deleteByUserAndLesson(
    userId: string,
    lessonId: string,
  ) {
    const index = this.items.findIndex((item) => item.lessonId === lessonId && item.userId === userId)

    if (index === -1) {
      return false
    }

    this.items.splice(index, 1)

    return true
  }

}
