import { beforeEach, describe, expect, it } from 'vitest'
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

  it('Should createa new journeys', async () => {

    const { journey } = await sut.execute({
      title: 'New Journey',
      description: 'Description...',
      level: 'Intermediate',
      sectorsIds: ['01'],
      responsibleId: 'resp-01',
      plantId: 'plant-01'
    })

    const sectorLinked = await inMemoryJourneySectorsRepository.findByJourneyIdAndSectorId(journey.id,'01')

    expect(journey.level).toEqual('Intermediate')
    expect(sectorLinked?.sectorId).toEqual('01')
  })

  // it('Should not be able to register with same email twice', async () => {
  //   await app.ready()

  //   const email = 'teste@gmail.com'

  //   await sut.execute({
  //     name: 'test_name',
  //     email,
  //     password: '1234',
  //     registration_number: '1',
  //     plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
  //   })

  //   await expect(() =>
  //     sut.execute({
  //       name: 'test_name',
  //       email,
  //       password: '1234',
  //       registration_number: '2',
  //       plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
  //     }),
  //   ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  // })
  // it('Should not be able to register with same registration_number twice', async () => {
  //   await app.ready()

  //   const registration_number = '1234'

  //   await sut.execute({
  //     name: 'test_name',
  //     email: 'test@gmail.com',
  //     password: '1234',
  //     registration_number,
  //     plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
  //   })

  //   await expect(() =>
  //     sut.execute({
  //       name: 'test_name',
  //       email: 'test01@gmail.com',
  //       password: '1234',
  //       registration_number,
  //       plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
  //     }),
  //   ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  // })
})
