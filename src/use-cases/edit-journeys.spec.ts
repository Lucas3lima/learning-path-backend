import { beforeEach, describe, expect, it } from 'vitest'
import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysAlreadyExistsError } from '../_erros/journeys-already-exists-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { EditJourneysUseCase } from './edit-journeys.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let sut: EditJourneysUseCase

describe('Edit journeys Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    sut = new EditJourneysUseCase(inMemoryJourneysRepository)
  })

  it('Should edit a journey', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    const { journey } = await sut.execute({
      id: '01',
      plantId: 'plant-01',
      title: 'New Journey 02',
      description: 'Description edit',
      level: 'Advanced',
      visible: false,
    })

    expect(journey.slug).toEqual('new-journey-02')
    expect(journey.description).toEqual('Description edit')
    expect(journey.level).toEqual('Advanced')
    expect(journey.visible).toEqual(false)
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
    await inMemoryJourneysRepository.create({
      id: '02',
      title: 'New Journey 02',
      slug: 'new-journey-02',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        id: '01',
        plantId: 'plant-01',
        title: 'New Journey 02',
      }),
    ).rejects.toBeInstanceOf(JourneysAlreadyExistsError)
  })

  it('Should not be able to edit a jurney for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        id: '05',
        plantId: 'plant-01',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(GenericEditingError)
  })
})
