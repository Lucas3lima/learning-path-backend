import { beforeEach, describe, expect, it } from 'vitest'
import { GenericDeletingError } from '../_erros/generic-deleting-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { DeleteModulesUseCase } from './delete-modules.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let sut: DeleteModulesUseCase

describe('Delete modules Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    sut = new DeleteModulesUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
    )
  })

  it('Should delete a module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Módulo 01',
      slug: 'modulo-01',
      hour: 2,
    })

    const { deleted } = await sut.execute({
      id: '01',
      journeySlug: 'journey',
      plantId: 'plant-01',
    })

    expect(deleted).toEqual(true)
  })

  it('should not be able to delete a journey with the wrong plantId', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Módulo 01',
      slug: 'modulo-01',
      hour: 2,
    })

    await expect(() =>
      sut.execute({
        id: '01',
        journeySlug: 'journey',
        plantId: 'wrongPlantId',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
  it('should not be able to delete a journey with the wrong journeySlug', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Módulo 01',
      slug: 'modulo-01',
      hour: 2,
    })

    await expect(() =>
      sut.execute({
        id: '01',
        journeySlug: 'wrong-journey-slug',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
  it('should not be able to delete a journey with the wrong id', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Módulo 01',
      slug: 'modulo-01',
      hour: 2,
    })

    await expect(() =>
      sut.execute({
        id: '02',
        journeySlug: 'wrong-journey-slug',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
