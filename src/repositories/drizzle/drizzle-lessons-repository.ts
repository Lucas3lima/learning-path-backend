import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { lessons } from '../../database/schema.ts'
import type {
  CreateLessonsInput,
  EditLessonInput,
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
  async findByModuleId(moduleId: string) {
    return await db.select().from(lessons).where(eq(lessons.moduleId, moduleId))
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
  async findByIdAndModuleId(id: string, moduleId: string) {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, id), eq(lessons.moduleId, moduleId)))

    if (!lesson) {
      return null
    }

    return lesson
  }
  async create(data: CreateLessonsInput) {
    const [lesson] = await db.insert(lessons).values(data).returning()

    return lesson
  }

  async edit(data: EditLessonInput) {
    const { id, ...fields } = data

    const [updated] = await db
      .update(lessons)
      .set(fields)
      .where(eq(lessons.id, id))
      .returning()

    return updated ?? null
  }
  async delete(id: string) {
    const result = await db
      .delete(lessons)
      .where(eq(lessons.id, id))
      .returning({ id: lessons.id })

    // Se deletou, result[0] existe
    return result.length > 0
  }
  async findManyByIds(ids: string[]){
    if(ids.length === 0) {
      return []
    }

    const result = await db.select()
      .from(lessons)
      .where(inArray(lessons.id,ids))

    return result
  }
}
