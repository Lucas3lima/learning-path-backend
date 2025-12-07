import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { lessons } from '../../database/schema.ts'
import type {
  CreateLessonsInput,
  LessonsRepository,
} from '../lessons-repository.ts'

export class DrizzleLessonsRepository implements LessonsRepository {
  async findById(id: string) {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id))

    if (!lesson) {
      return null
    }

    return lesson
  }
  async findBySlugAndModuleId(slug: string, moduleId: string) {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.slug, slug), eq(lessons.moduleId, moduleId)))

    if (!lesson) {
      return null
    }

    return lesson
  }
  async create(data: CreateLessonsInput) {
    const [lesson] = await db.insert(lessons).values(data).returning()

    return lesson
  }

  async nextOrder(moduleId: string) {
    const [{ nextOrder }] = await db
      .select({
        nextOrder: sql<number>`COALESCE(MAX(${lessons.order}) + 1, 1)`,
      })
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
    return nextOrder
  }
}
