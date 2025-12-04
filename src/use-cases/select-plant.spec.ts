import { beforeEach, describe, expect, it } from 'vitest'
import { InvalidCredentialsError } from '../_erros/invalid-credentials-error.ts'
import { PlantAccessDeniedError } from '../_erros/plant-access-denied-error.ts'
import { InMemoryUsersRepository } from '../repositories/in-memory/in-memory-user-repository.ts'
import { InMemoryUsersPlantsRepository } from '../repositories/in-memory/in-memory-userPlants-repository.ts'
import { SelectPlantUseCase } from './select-plants.ts'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryUserPlantsRepository: InMemoryUsersPlantsRepository
let sut: SelectPlantUseCase

describe('Select plant Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryUserPlantsRepository = new InMemoryUsersPlantsRepository()
    sut = new SelectPlantUseCase(
      inMemoryUsersRepository,
      inMemoryUserPlantsRepository,
    )
  })

  it('Should be able to get linked plants', async () => {
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

    const { user, linkedPlants } = await sut.execute({
      userId: createdUser.id,
      plantId: 'plant-01',
    })

    expect(user).toEqual(createdUser)
    expect(linkedPlants.role).toBe('student')
    expect(linkedPlants.plantId).toBe('plant-01')
  })

  it('Should throw if user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent-user',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
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
    ).rejects.toBeInstanceOf(PlantAccessDeniedError)
  })
})
