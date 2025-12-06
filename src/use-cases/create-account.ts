import { hash } from 'bcryptjs'
import { UserAlreadyExistsError } from '../_erros/user-already-exists-error.ts'
import type { UserPlantsRepository } from '../repositories/userPlants-repository.ts'
import type { UsersRepository } from '../repositories/users-repository.ts'

interface RegisterUserCaseRequest {
  name: string
  email: string
  registration_number: string
  password: string
  role?: 'user' | 'manager' | null
  plant_id: string
}
export class CreateAccountUseCase {
  private usersRepository: UsersRepository
  private userPlantsRepository: UserPlantsRepository
  constructor(
    usersRepository: UsersRepository,
    userPlantsRepository: UserPlantsRepository,
  ) {
    this.usersRepository = usersRepository
    this.userPlantsRepository = userPlantsRepository
  }
  async execute({
    name,
    email,
    registration_number,
    role,
    plant_id,
    password,
  }: RegisterUserCaseRequest) {
    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new UserAlreadyExistsError('Email já registrado no sistema.')
    }

    const userWithSameRegistrationNumber =
      await this.usersRepository.findByRegistration(registration_number)

    if (userWithSameRegistrationNumber) {
      throw new UserAlreadyExistsError('Matricula já registrada no sistema.')
    }

    const password_hash = await hash(password, 6)

    const user = await this.usersRepository.create({
      name,
      email,
      password_hash,
      registration_number,
      role: role ?? 'user',
    })

    await this.userPlantsRepository.create({
      plantId: plant_id,
      userId: user.id,
      role: role === 'manager' ? 'manager' : 'student',
    })

    return {
      user,
    }
  }
}
