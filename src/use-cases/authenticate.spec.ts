import { hash } from 'bcryptjs'
import { beforeEach, describe, expect, it } from 'vitest'
import { InvalidCredentialsError } from '../_erros/invalid-credentials-error.ts'
import { InMemoryUsersRepository } from '../repositories/in-memory/in-memory-user-repository.ts'
import { AuthenticateUseCase } from './authenticate.ts'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: AuthenticateUseCase

describe('Authenticate Use Case', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new AuthenticateUseCase(inMemoryUsersRepository)
  })

  it('Should be able to authenticate', async () => {
    const email = 'john@test.com'
    const password = 'hash'

    const createdUser = await inMemoryUsersRepository.create({
      id: 'user-01',
      name: 'John Doe',
      email,
      registration_number: '12345',
      password_hash: await hash(password, 6),
    })

    const { user } = await sut.execute({
      email,
      password,
    })

    expect(user).toEqual(createdUser)
  })

  it('Should not be able to authenticate with an invalid email', async () => {
    const email = 'john@test.com'
    const password = 'hash'

    await inMemoryUsersRepository.create({
      id: 'user-01',
      name: 'John Doe',
      email,
      registration_number: '12345',
      password_hash: password,
    })

    await expect(() =>
      sut.execute({
        email: 'invalid@email.com',
        password,
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
  it('should not be able to authenticate with an invalid password', async () => {
    const email = 'john@test.com'
    const password = 'hash'

    await inMemoryUsersRepository.create({
      id: 'user-01',
      name: 'John Doe',
      email,
      registration_number: '12345',
      password_hash: await hash(password, 6),
    })

    await expect(() =>
      sut.execute({
        email,
        password: 'invalid-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })
})
