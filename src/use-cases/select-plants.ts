import { InvalidCredentialsError } from '../_erros/invalid-credentials-error.ts'
import { PlantAccessDeniedError } from '../_erros/plant-access-denied-error.ts'
import type { UserPlantsRepository } from '../repositories/userPlants-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface SelectPlantUseCaseRequest {
  plantId: string
  userId: string
}
export class SelectPlantUseCase {
  private usersRepository: UsersRepository
  private userPlantsRepository: UserPlantsRepository
  constructor(
    usersRepository: UsersRepository,
    userPlantsRepository: UserPlantsRepository,
  ) {
    this.usersRepository = usersRepository
    this.userPlantsRepository = userPlantsRepository
  }
  async execute({ plantId, userId }: SelectPlantUseCaseRequest) {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const linkedPlants = await this.userPlantsRepository.findByUserIdAndPlantId(
      user.id,
      plantId,
    )

    if (!linkedPlants) {
      throw new PlantAccessDeniedError()
    }

    return {
      user,
      linkedPlants
    }
  }
}
