import { beforeEach, describe, expect, it } from 'vitest'
import { JourneysAlreadyExistsError } from '../_erros/journeys-already-exists-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryJourneySectorsRepository } from '../repositories/in-memory/in-memory-journeys-sectors-repository.ts'
import { CreateJourneysUseCase } from './create-journeys.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryJourneySectorsRepository: InMemoryJourneySectorsRepository
let sut: CreateJourneysUseCase

describe('Create Journeys Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryJourneySectorsRepository = new InMemoryJourneySectorsRepository()
    sut = new CreateJourneysUseCase(
      inMemoryJourneysRepository,
      inMemoryJourneySectorsRepository,
    )
  })

  it('Should create a new journeys', async () => {
    const { journey } = await sut.execute({
      title: 'New Journey',
      description: 'Description...',
      level: 'Intermediate',
      sectorsIds: ['01'],
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    const sectorLinked =
      await inMemoryJourneySectorsRepository.findByJourneyIdAndSectorId(
        journey.id,
        '01',
      )

    expect(journey.level).toEqual('Intermediate')
    expect(sectorLinked?.sectorId).toEqual('01')
  })

  it('Should not be able to create journey with same slug twice', async () => {
    await sut.execute({
      title: 'New Journey',
      description: 'Description...',
      level: 'Intermediate',
      sectorsIds: ['01'],
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        title: 'New Journey',
        description: 'Description...',
        level: 'Intermediate',
        sectorsIds: ['01'],
        responsibleId: 'resp-01',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(JourneysAlreadyExistsError)
  })
})
