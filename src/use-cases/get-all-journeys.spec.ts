import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryJourneySectorsRepository } from '../repositories/in-memory/in-memory-journeys-sectors-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { InMemoryUsersRepository } from '../repositories/in-memory/in-memory-user-repository.ts'
import { GetAllJourneysUseCase } from './get-all-journeys.ts'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryjourneysSectorsRepository: InMemoryJourneySectorsRepository
let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let sut: GetAllJourneysUseCase

describe('Get all journeys Use Case', () => {
  beforeEach(async () => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryjourneysSectorsRepository = new InMemoryJourneySectorsRepository()
    sut = new GetAllJourneysUseCase(
      inMemoryUsersRepository,
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryjourneysSectorsRepository,
    )

    await inMemoryUsersRepository.create({
      id: '01',
      name: 'user test',
      email: 'test@test.com',
      password_hash: 'password_hash',
      registration_number: '2469',
      role: 'manager',
    })
  })

  it('Get all journeys', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Test 01',
      slug: 'test_01',
      plantId: '01',
      responsibleId: '01',
      level: 'Advanced',
      description: 'description',
    })

    await inMemoryJourneysRepository.create({
      id: '02',
      title: 'Test 02',
      slug: 'test_02',
      plantId: '01',
      responsibleId: '01',
      level: 'Intermediate',
      description: 'description',
    })

    await inMemoryModulesRepository.create({
      title: 'module',
      slug: 'module',
      journeyId: '01',
      hour: 2,
    })
    await inMemoryModulesRepository.create({
      title: 'module 02',
      slug: 'module_02',
      journeyId: '01',
      hour: 4,
    })

    const response = await sut.execute({
      plantId: '01',
    })

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '01',
          title: 'Test 01',
          description: 'description',
          level: 'Advanced',
          totalHours: 6,
          totalModules: 2,
          responsible: expect.objectContaining({
            id: '01',
            name: expect.any(String),
            email: expect.any(String),
          }),
          sectors: expect.any(Array),
        }),
        expect.objectContaining({
          id: '02',
          title: 'Test 02',
          description: 'description',
          level: 'Intermediate',
          totalHours: 0,
          totalModules: 0,
          responsible: expect.objectContaining({
            id: '01',
            name: expect.any(String),
            email: expect.any(String),
          }),
          sectors: expect.any(Array),
        }),
      ]),
    )
  })
})
