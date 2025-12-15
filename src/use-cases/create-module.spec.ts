import { beforeEach, describe, expect, it } from 'vitest'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesAlreadyExistsError } from '../_erros/modules-already-exists-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { CreateModuleUseCase } from './create-module.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let sut: CreateModuleUseCase

describe('Create modules Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    sut = new CreateModuleUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
    )
  })

  it('Should create a new module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    const { module } = await sut.execute({
      title: 'New Module',
      description: 'Description...',
      hour: 1,
      journeySlug: 'new_journey',
      plantId: 'plant-01',
    })

    expect(module.order).toEqual(1)
    expect(module.slug).toEqual('new-module')
    expect(module.journeyId).toEqual('01')
  })

  it('Should not be able to create module with a duplicate slug in the same journey', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await sut.execute({
      title: 'New Module',
      description: 'Description...',
      hour: 1,
      journeySlug: 'new_journey',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        title: 'New Module',
        description: 'Description 02...',
        hour: 10,
        journeySlug: 'new_journey',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(ModulesAlreadyExistsError)
  })

  it('Should not be able to create a module for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        title: 'Module',
        hour: 1,
        description: '...',
        journeySlug: 'unknown',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should increment order automatically', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      plantId: 'plant-01',
      description: '...',
      level: 'Intermediate',
      responsibleId: 'resp',
    })

    await sut.execute({
      title: 'Module 1',
      hour: 1,
      description: '...',
      journeySlug: 'journey',
      plantId: 'plant-01',
    })

    const { module } = await sut.execute({
      title: 'Module 2',
      hour: 1,
      description: '...',
      journeySlug: 'journey',
      plantId: 'plant-01',
    })

    expect(module.order).toEqual(2)
  })

  it('Should allow creating modules with the same title in different journeys', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey One',
      slug: 'journey_one',
      description: '...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryJourneysRepository.create({
      id: '02',
      title: 'Journey Two',
      slug: 'journey_two',
      description: '...',
      level: 'Advanced',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    // Create module in journey 1
    const { module: module1 } = await sut.execute({
      title: 'Repeated Module',
      description: 'First...',
      hour: 1,
      journeySlug: 'journey_one',
      plantId: 'plant-01',
    })

    // Create same title module in journey 2
    const { module: module2 } = await sut.execute({
      title: 'Repeated Module',
      description: 'Second...',
      hour: 2,
      journeySlug: 'journey_two',
      plantId: 'plant-01',
    })

    expect(module1.slug).toEqual('repeated-module')
    expect(module2.slug).toEqual('repeated-module')

    expect(module1.journeyId).toBe('01')
    expect(module2.journeyId).toBe('02')

    // They MUST be allowed (no error thrown)
    expect(module1.id).not.toBe(module2.id)
  })
})
