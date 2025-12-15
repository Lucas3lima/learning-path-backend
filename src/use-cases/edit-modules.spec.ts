import { beforeEach, describe, expect, it } from 'vitest'
import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesAlreadyExistsError } from '../_erros/modules-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { EditModulesUseCase } from './edit-modules.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let sut: EditModulesUseCase

describe('Edit modules Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    sut = new EditModulesUseCase(
      inMemoryModulesRepository,
      inMemoryJourneysRepository,
    )
  })

  it('Should edit a module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new-journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Module 01',
      slug: 'module-01',
      hour: 2,
      description: 'desc',
    })

    const { module } = await sut.execute({
      journeySlug: 'new-journey',
      id: '01',
      plantId: 'plant-01',
      title: 'module 02',
      description: 'desc edit',
      hour: 1,
      order: 2,
    })

    expect(module.slug).toEqual('module-02')
    expect(module.description).toEqual('desc edit')
    expect(module.hour).toEqual(1)
    expect(module.order).toEqual(2)
  })

  it('Should not be able to edit a journey title to use a slug that already exists', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new-journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })
    await inMemoryModulesRepository.create({
      id: '01',
      journeyId: '01',
      title: 'Module 01',
      slug: 'module-01',
      hour: 2,
      description: 'desc',
    })

    await inMemoryModulesRepository.create({
      id: '02',
      journeyId: '01',
      title: 'Module 02',
      slug: 'module-02',
      hour: 2,
      description: 'desc',
    })

    await expect(() =>
      sut.execute({
        journeySlug: 'new-journey',
        id: '01',
        plantId: 'plant-01',
        title: 'Module 02',
      }),
    ).rejects.toBeInstanceOf(ModulesAlreadyExistsError)
  })

  it('Should not be able to edit a module for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        id: '01',
        journeySlug: 'non-existing',
        plantId: 'plant-01',
        description: 'desc',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })
  it('Should not be able to edit a module for a non-existing module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new-journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        id: 'non-existing',
        journeySlug: 'new-journey',
        plantId: 'plant-01',
        description: 'desc',
      }),
    ).rejects.toBeInstanceOf(GenericEditingError)
  })
})
