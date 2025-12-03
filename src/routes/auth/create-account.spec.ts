import { compare } from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserAlreadyExistsError } from '../../_erros/user-already-exists-error.ts'
import { app } from '../../app.ts'
import { InMemoryUsersRepository } from '../../repositories/in-memory/in-memory-user-repository.ts'
import { InMemoryUsersPlantsRepository } from '../../repositories/in-memory/in-memory-userPlants-repository.ts'
import { CreateAccountUseCase } from '../../use-cases/createAccount.ts'

let inMemoryUsersRepository: InMemoryUsersRepository
let inMemoryUserPlantsRepository: InMemoryUsersPlantsRepository
let sut: CreateAccountUseCase

describe('Create Account Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    inMemoryUserPlantsRepository = new InMemoryUsersPlantsRepository()
    sut = new CreateAccountUseCase(
      inMemoryUsersRepository,
      inMemoryUserPlantsRepository,
    )
  })

  it('Should hash user password upon registration', async () => {
    await app.ready()

    const { user } = await sut.execute({
      name: 'test_name',
      email: 'teste@gmail.com',
      password: '1234',
      registration_number: '2469',
      plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
    })

    const isPasswordCorrectlyHash = await compare('1234', user.password_hash)

    expect(isPasswordCorrectlyHash).toBe(true)
  })

  it('Should not be able to register with same email twice', async () => {
    await app.ready()

    const email = 'teste@gmail.com'

    await sut.execute({
      name: 'test_name',
      email,
      password: '1234',
      registration_number: '1',
      plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
    })

    expect(() =>
      sut.execute({
        name: 'test_name',
        email,
        password: '1234',
        registration_number: '2',
        plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
  it('Should not be able to register with same registration_number twice', async () => {
    await app.ready()

    const registration_number = '1234'

    await sut.execute({
      name: 'test_name',
      email: 'test@gmail.com',
      password: '1234',
      registration_number,
      plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
    })

    expect(() =>
      sut.execute({
        name: 'test_name',
        email: 'test01@gmail.com',
        password: '1234',
        registration_number,
        plant_id: '6b87a20a-73b3-4fe5-a5c0-1ad2593ad024',
      }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError)
  })
})
