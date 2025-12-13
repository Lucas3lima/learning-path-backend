import { beforeEach, describe, expect, it } from 'vitest'
import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { DeleteJourneysUseCase } from './delete-journeys.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let sut: DeleteJourneysUseCase

describe('Delete journeys Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    sut = new DeleteJourneysUseCase(inMemoryJourneysRepository)
  })

  it('Should delete a journey', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    const { deleted } = await sut.execute({
      id: '01',
      plantId: 'plant-01',
    })

    expect(deleted).toEqual(true)
  })

  it('should not be able to delete a journey with the wrong plantId', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        id: '01',
        plantId: 'wrongPlantId',
      }),
    ).rejects.toBeInstanceOf(GenericDeletingError)
  })

})
