import { compare } from 'bcryptjs'
import { InvalidCredentialsError } from '../_erros/invalid-credentials-error.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface AuthenticateUseCaseRequest {
  email: string
  password: string
}
export class AuthenticateUseCase {
  private usersRepository: UsersRepository
  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository
  }
  async execute({ email, password }: AuthenticateUseCaseRequest) {
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const isPasswordValid = await compare(password, user.password_hash)

    if (!isPasswordValid) {
      throw new InvalidCredentialsError()
    }

    return {
      user,
    }
  }
}
