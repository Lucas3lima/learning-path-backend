import { beforeEach, describe, expect, it } from 'vitest'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { PlantNotFoundError } from '../_erros/plant-not-found-error.ts'
import { InMemoryUsersRepository } from '../repositories/in-memory/in-memory-user-repository.ts'
import { InMemoryUsersPlantsRepository } from '../repositories/in-memory/in-memory-userPlants-repository.ts'
import { GetProfileUseCase } from './get-profile.ts'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryUserPlantsRepository: InMemoryUsersPlantsRepository
let sut: GetProfileUseCase

describe('Get profile Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryUserPlantsRepository = new InMemoryUsersPlantsRepository()
    sut = new GetProfileUseCase(
      inMemoryUsersRepository,
      inMemoryUserPlantsRepository,
    )
  })

  it('Should be able to get User', async () => {
    const createdUser = await inMemoryUsersRepository.create({
      id: 'user-01',
      name: 'Lucas',
      email: 'lucas@gmail.com',
      password_hash: 'hash',
      registration_number: '123',
    })

    await inMemoryUserPlantsRepository.create({
      id: 'up-01',
      userId: createdUser.id,
      plantId: 'plant-01',
      role: 'student',
    })

    const result = await sut.execute({
      userId: createdUser.id,
      plantId: 'plant-01',
    })

    expect(result).toEqual({
      id: createdUser.id,
      name: 'Lucas',
      email: 'lucas@gmail.com',
      registration_number: '123',
      role: 'user',
      plantRole: 'student',
    })
  })

  it('Should throw if user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent-user',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
  it('should throw if plant is not linked to user', async () => {
    const user = await inMemoryUsersRepository.create({
      id: 'user-01',
      name: 'John Doe',
      email: 'john@test.com',
      registration_number: '12345',
      password_hash: 'hash',
      role: 'user',
    })

    await expect(() =>
      sut.execute({
        userId: user.id,
        plantId: 'plant-not-linked',
      }),
    ).rejects.toBeInstanceOf(PlantNotFoundError)
  })
})
