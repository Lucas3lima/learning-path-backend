import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../database/client.ts'
import { modules } from '../../database/schema.ts'
import type {
  CreateModuleInput,
  ModulesRepository,
} from '../modules-repository.ts'

export class DrizzleModulesRepository implements ModulesRepository {
  async findByJourneyId(journeyId: string) {
    return await db
      .select({
        id: modules.id,
        title: modules.title,
        slug: modules.slug,
        order: modules.order,
        hour: modules.hour,
        description: modules.description,
      })
      .from(modules)
      .where(eq(modules.journeyId, journeyId))
      .orderBy(modules.order)
  }
  async findById(id: string) {
    const [module] = await db.select().from(modules).where(eq(modules.id, id))

    if (!module) {
      return null
    }

    return module
  }
  async findBySlugAndJourneyId(slug: string, journeyId: string) {
    const [module] = await db
      .select()
      .from(modules)
      .where(and(eq(modules.slug, slug), eq(modules.journeyId, journeyId)))

    if (!module) {
      return null
    }

    return module
  }
  async create(data: CreateModuleInput) {
    const [module] = await db.insert(modules).values(data).returning()

    return module
  }

  async nextOrder(journeyId: string) {
    const [{ nextOrder }] = await db
      .select({
        nextOrder: sql<number>`COALESCE(MAX(${modules.order}) + 1, 1)`,
      })
      .from(modules)
      .where(eq(modules.journeyId, journeyId))
    return nextOrder
  }
}
