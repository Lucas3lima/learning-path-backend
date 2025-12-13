import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const countries = pgTable('countries', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const plants = pgTable('plants', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),

  country_id: uuid()
    .notNull()
    .references(() => countries.id),
})

export const userRoleValues = ['user', 'manager'] as const

export const userRole = pgEnum('user_role', userRoleValues)

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: text(),
  email: text().notNull().unique(),
  password_hash: text().notNull(),
  registration_number: text().notNull().unique(),
  role: userRole().notNull().default('user'),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const plantRoleValues = ['student', 'manager'] as const

export const plantRole = pgEnum('plant_role', plantRoleValues)

export const userPlants = pgTable(
  'user_plants',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plantId: uuid()
      .notNull()
      .references(() => plants.id, { onDelete: 'cascade' }),
    role: plantRole().notNull().default('student'),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex().on(table.userId, table.plantId)],
)

export const sectors = pgTable(
  'sectors',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    plantId: uuid()
      .notNull()
      .references(() => plants.id, { onDelete: 'cascade' }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex().on(table.plantId, table.slug)],
)

export const trainingLevelValues = [
  'Beginner',
  'Intermediate',
  'Advanced',
] as const

export const trainingLevel = pgEnum('trainingLevel', trainingLevelValues)

export const journeys = pgTable(
  'journeys',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    slug: text().notNull(),
    description: text(),
    thumbnail_url: text(),
    level: trainingLevel().notNull().default('Beginner'),
    visible: boolean().notNull().default(true),

    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),

    responsibleId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plantId: uuid()
      .notNull()
      .references(() => plants.id, { onDelete: 'cascade' }),
  },
  // Slug único por planta
  (table) => [uniqueIndex().on(table.plantId, table.slug)],
)

export const journey_sectors = pgTable(
  'journey_sectors',
  {
    id: uuid().primaryKey().defaultRandom(),
    journeyId: uuid()
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
    sectorId: uuid()
      .notNull()
      .references(() => sectors.id, { onDelete: 'cascade' }),

    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex().on(table.sectorId, table.journeyId)],
)

export const modules = pgTable(
  'modules',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text(),
    slug: text().notNull(),
    order: integer().notNull().default(1),
    hour: integer().notNull().default(0),

    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),

    journeyId: uuid()
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex().on(table.journeyId, table.slug)],
)

export const lessons = pgTable(
  'lessons',
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text().notNull(),
    slug: text().notNull(),
    order: integer().default(1),
    content: text(),
    video_url: text(),
    pdf_url: text(),

    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),

    moduleId: uuid()
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
  },
  (table) => [uniqueIndex().on(table.moduleId, table.slug)],
)
