import type { PlantsRepository } from '../repositories/plants-repository.ts'

interface PlantResponse {
  id: string
  name: string
  slug: string
}

interface GetPlantsUseCaseResponse {
  plants: PlantResponse[]
}

export class GetPlantsUseCase {
  private plantsRepository: PlantsRepository
  constructor(plantsRepository: PlantsRepository) {
    this.plantsRepository = plantsRepository
  }
  async execute(): Promise<GetPlantsUseCaseResponse> {
    const plants = await this.plantsRepository.getAll()

    return {
      plants: plants.map((plant) => ({
        id: plant.id,
        name: plant.name,
        slug: plant.slug,
      })),
    }
  }
}
