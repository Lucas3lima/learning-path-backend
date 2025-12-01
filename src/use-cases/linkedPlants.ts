import { NotFoundError } from '../_erros/not-found-error.ts'
import type { UserPlantsRepository } from '../repositories/userPlants-repository.ts'

interface LinkedPlantsUseCaseRequest {
  userId: string
}
export class LinkedPlantsUseCase {
  private userPlantsRepository: UserPlantsRepository
  constructor(userPlantsRepository: UserPlantsRepository) {
    this.userPlantsRepository = userPlantsRepository
  }
  async execute({ userId }: LinkedPlantsUseCaseRequest) {
    const linkedPlants = await this.userPlantsRepository.linkedPlants(userId)

    if (linkedPlants.length === 0) {
      throw new NotFoundError('Plantas não encontradas.')
    }

    return {
      linkedPlants,
    }
  }
}
