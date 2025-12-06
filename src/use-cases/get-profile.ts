import { NotFoundError } from '../_erros/not-found-error.ts'
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
}
export class GetProfileUseCase {
  private usersRepository: UsersRepository
  private userPlantsRepository: UserPlantsRepository
  constructor(
    usersRepository: UsersRepository,
    userPlantsRepository: UserPlantsRepository,
  ) {
    this.usersRepository = usersRepository
    this.userPlantsRepository = userPlantsRepository
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
      throw new NotFoundError('Planta não encontrada!')
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      registration_number: user.registration_number,
      role: user.role,
      plantRole: plant.role,
    }
  }
}
