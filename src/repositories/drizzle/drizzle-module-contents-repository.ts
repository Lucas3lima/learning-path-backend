import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { moduleContents } from '../../database/schema.ts'
import type {
  CreateModuleContentsInput,
  ModuleContentsRepository,
} from '../module-contents-repository.ts'

export class DrizzleModuleContentsRepository
  implements ModuleContentsRepository
{
  async findById(id: string) {
    const [moduleContent] = await db
      .select()
      .from(moduleContents)
      .where(eq(moduleContents.id, id))

    if (!moduleContent) {
      return null
    }
    return moduleContent
  }
  async findByIdAndModuleId(id: string, moduleId: string) {
    const [moduleContent] = await db
      .select()
      .from(moduleContents)
      .where(
        and(
           eq(moduleContents.id, id),
           eq(moduleContents.moduleId, moduleId)
        )
    )

    if (!moduleContent) {
      return null
    }
    return moduleContent
  }
  async findByModuleId(moduleId: string) {
    return await db
      .select()
      .from(moduleContents)
      .where(eq(moduleContents.moduleId, moduleId))
  }
  async create(data: CreateModuleContentsInput) {
    const [result] = await db.insert(moduleContents).values(data).returning()

    return result
  }
  async delete(id: string) {
    const result = await db
        .delete(moduleContents)
        .where(eq(moduleContents.id, id))
        .returning({ id: moduleContents.id })

    // Se deletou, result[0] existe
    return result.length > 0
  }

  async nextOrder(moduleId: string) {
      const [{ nextOrder }] = await db
        .select({
          nextOrder: sql<number>`COALESCE(MAX(${moduleContents.order}) + 1, 1)`,
        })
        .from(moduleContents)
        .where(eq(moduleContents.moduleId, moduleId))
      return nextOrder
    }
}
