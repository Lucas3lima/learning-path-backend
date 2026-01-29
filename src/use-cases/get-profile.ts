import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import type { PlantsRepository } from '../repositories/plants-repository.ts'
import type { UserPlantsRepository } from '../repositories/userPlants-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface GetProfileUseCaseRequest {
  userId: string
  plantId: string
}
interface GetProfileUseCaseReponse {
  id: string
  name: string | null
  email: string
  registration_number: string
  role: 'user' | 'manager'
  plantRole: 'manager' | 'student'
  plantId: string
  plantName: string
}
export class GetProfileUseCase {
  private usersRepository: UsersRepository
  private userPlantsRepository: UserPlantsRepository
  private plantRepository: PlantsRepository
  constructor(
    usersRepository: UsersRepository,
    userPlantsRepository: UserPlantsRepository,
    plantRepository: PlantsRepository,
  ) {
    this.usersRepository = usersRepository
    this.userPlantsRepository = userPlantsRepository
    this.plantRepository = plantRepository
  }
  async execute({
    userId,
    plantId,
  }: GetProfileUseCaseRequest): Promise<GetProfileUseCaseReponse> {
    const { user } = await this.usersRepository.getProfile(userId)

    if (!user) {
      throw new NotFoundError('Usuário não encontrado!')
    }

    const plant = await this.userPlantsRepository.findByUserIdAndPlantId(
      userId,
      plantId,
    )

    if (!plant) {
      throw new PlantNotFoundError()
    }

    const plantReal = await this.plantRepository.findById(plantId)

    if (!plantReal) {
      throw new PlantNotFoundError()
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      registration_number: user.registration_number,
      role: user.role,
      plantRole: plant.role,
      plantId: plant.id,
      plantName: plantReal.name,
    }
  }
}
