import { beforeEach, describe, expect, it } from 'vitest'
import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { FakeStorageProvider } from '../repositories/disk-storage/fake-storage-provider.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryPlantsRepository } from '../repositories/in-memory/in-memory-plants-repository.ts'
import { DeleteJourneysUseCase } from './delete-journeys.ts'

let inMemoryPlantsRepository: InMemoryPlantsRepository
let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryFakeStorage: FakeStorageProvider
let sut: DeleteJourneysUseCase

describe('Delete journeys Use Case', () => {
  beforeEach(() => {
    inMemoryPlantsRepository = new InMemoryPlantsRepository()
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryFakeStorage = new FakeStorageProvider()
    sut = new DeleteJourneysUseCase(
      inMemoryPlantsRepository,
      inMemoryJourneysRepository,
      inMemoryFakeStorage,
    )
  })

  it('Should delete a journey', async () => {
    await inMemoryPlantsRepository.create({
      id: 'plant-01',
      country_id: '01',
      name: 'test',
      slug: 'test',
    })
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
    await inMemoryPlantsRepository.create({
      id: 'plant-01',
      country_id: '01',
      name: 'test',
      slug: 'test',
    })
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
    ).rejects.toBeInstanceOf(PlantNotFoundError)
  })
})
