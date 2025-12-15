import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { exams } from '../../database/schema.ts'
import type {
    CreateExamsInput,
    ExamsRepository
} from '../exams-repository.ts'

export class DrizzleExamsRepository implements ExamsRepository {
  async findById(id: string) {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id))

    if (!exam) {
      return null
    }

    return exam
  }
  async findBySlugAndModuleId(slug: string, moduleId: string) {
    const [exam] = await db.select().from(exams).where(
        and(
            eq(exams.slug, slug),
            eq(exams.moduleId, moduleId)
        )
    )

    if (!exam) {
      return null
    }

    return exam
  }
  async findByIdAndModuleId(id: string, moduleId: string) {
    const [exam] = await db.select().from(exams).where(
        and(
            eq(exams.id, id),
            eq(exams.moduleId, moduleId)
        )
    )

    if (!exam) {
      return null
    }

    return exam
  }
  async findByModuleId(moduleId: string) {
    return await db.select().from(exams).where(eq(exams.moduleId, moduleId))
  }
  async create(data: CreateExamsInput) {
    const [lesson] = await db.insert(exams).values(data).returning()
    
    return lesson
  }
  async delete(id: string) {
    const result = await db
        .delete(exams)
        .where(
            eq(exams.id, id),
        )
        .returning({ id: exams.id })
    
    // Se deletou, result[0] existe
    return result.length > 0
  }
}
