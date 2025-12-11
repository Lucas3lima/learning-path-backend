import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'

interface DeleteJourneyUseCaseRequest {
  id: string
  plantId?: string
}

export class DeleteJourneysUseCase {
  private journeysRepository: JourneysRepository
  constructor(journeysRepository: JourneysRepository) {
    this.journeysRepository = journeysRepository
  }
  async execute({
    id,
    plantId,

  }: DeleteJourneyUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    const deleted = await this.journeysRepository.delete(id, plantId)



    if(!deleted){
      throw new GenericDeletingError('Jornada não encontrada ou não pôde ser deletada.')
    }

    return {
      deleted,
    }
  }
}
