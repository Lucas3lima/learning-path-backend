import type { 
  CreateUserPlantsInput, 
  LinkedPlant, 
  UserPlants, 
  UserPlantsRepository 
} from '../userPlants-repository.ts'

export class InMemoryUsersPlantsRepository implements UserPlantsRepository {
  public items: UserPlants[] = [] // <- Aqui já guarda userPlants
  public plantsItems: {
    id: string
    name: string | null
  }[] = []

  async create(data: CreateUserPlantsInput) {
    const userPlants: UserPlants = {
      id: data.id ?? crypto.randomUUID(),
      userId: data.userId,
      plantId: data.plantId,
      role: data.role ?? 'student',
      created_at: new Date(),
    }

    this.items.push(userPlants)
    return userPlants
  }

  async findByUserIdAndPlantId(userId: string, plantId: string) {
    const userPlants = this.items.find(
      (item) => item.userId === userId && item.plantId === plantId,
    )

    if (!userPlants) return null
    return userPlants
  }

  async linkedPlants(userId: string) {
    const userPlants = this.items.filter(
      (item) => item.userId === userId
    )

    const linked = userPlants
      .map((item) => {
        const plant = this.plantsItems.find(
          (p) => p.id === item.plantId
        )

        if (!plant) return null

        return {
          id: plant.id,
          name: plant.name ?? null,
          role: item.role,
        }
      })
      .filter((x): x is LinkedPlant => x !== null)

    return linked
  }
}
