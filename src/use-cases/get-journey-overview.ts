import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import type { JourneysSectorsRepository } from '../repositories/journeys-sectors-repository.ts'
import type { LessonsRepository } from '../repositories/lessons-repository.ts'
import type { ModulesRepository } from '../repositories/modules-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface GetJourneyOverviewUseCaseRequest {
  plantId?: string
  slug: string
}

interface GetJourneyOverviewUseCaseResponse {
  id: string
  title: string
  description: string | null
  level: string
  thumbnail_url: string | null
  sectors: {
    id: string
    name: string
  }[]
  responsible: {
    id: string
    name: string | null
    email: string
  }
  modules: {
    id: string
    title: string
    order: number
    slug: string
    hour: number
    description: string | null
    totalLessons: number
  }[]
  totalHours: number
  totalModules: number
}

export class GetJourneyOverviewUseCase {
  private usersRepository: UsersRepository
  private journeysRepository: JourneysRepository
  private modulesRepository: ModulesRepository
  private journeysSectorsRepository: JourneysSectorsRepository
  private lessonsRepository: LessonsRepository

  constructor(
    usersRepository: UsersRepository,
    journeysRepository: JourneysRepository,
    modulesRepository: ModulesRepository,
    journeysSectorsRepository: JourneysSectorsRepository,
    lessonsRepository: LessonsRepository,
  ) {
    this.usersRepository = usersRepository
    this.journeysRepository = journeysRepository
    this.modulesRepository = modulesRepository
    this.journeysSectorsRepository = journeysSectorsRepository
    this.lessonsRepository = lessonsRepository
  }

  async execute({
    plantId,
    slug,
  }: GetJourneyOverviewUseCaseRequest): Promise<GetJourneyOverviewUseCaseResponse> {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    // 1️⃣ Buscar a journey pelo slug e plantId
    const journey = await this.journeysRepository.findBySlugAndPlant(slug, plantId)
    if (!journey) {
      throw new NotFoundError('Trilha não encontrada.')
    }

    // 2️⃣ Buscar responsável
    const responsible = await this.usersRepository.findById(journey.responsibleId)

    // 3️⃣ Buscar módulos ordenados
    const journeyModules = await this.modulesRepository.findByJourneyId(journey.id)

    // 4️⃣ Buscar setores vinculados
    const journeySectorsResult = await this.journeysSectorsRepository.findAllJourneyId(journey.id)

    // 5️⃣ Enriquecer cada módulo com número de lessons e soma de horas das lessons
    const modules = await Promise.all(
      journeyModules.map(async (m) => {
        const lessons = await this.lessonsRepository.findByModuleId(m.id)
        console.log(lessons)
        const totalLessons = lessons.length

        return {
          id: m.id,
          title: m.title,
          order: m.order,
          slug: m.slug,
          hour: m.hour,
          description: m.description,
          totalLessons,
        }
      })
    )

    // 6️⃣ Calcular métricas do journey
    const totalHours = journeyModules.reduce((acc, m) => acc + m.hour, 0)
    const totalModules = modules.length

    return {
      id: journey.id,
      title: journey.title,
      description: journey.description,
      level: journey.level,
      thumbnail_url: journey.thumbnail_url,

      responsible: {
        id: responsible?.id ?? '',
        name: responsible?.name ?? null,
        email: responsible?.email ?? '',
      },

      sectors: journeySectorsResult.map((s) => ({
        id: s.id,
        name: s.name,
      })),

      modules,
      totalHours,
      totalModules,
    }
  }
}
