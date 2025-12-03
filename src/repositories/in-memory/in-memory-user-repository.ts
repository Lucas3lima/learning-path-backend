import type { CreateUserInput, User, UsersRepository } from '../users-repository.ts'

export class InMemoryUsersRepository implements UsersRepository {
    public items: User[] = []

    async findByEmail(email: string) {
        const user = this.items.find((item) => item.email === email)

        if(!user){
            return null
        }

        return user
    }
    async findById(id: string) {
        const user = this.items.find((item) => item.id === id)

        if(!user){
            return null
        }

        return user
    }
    async findByRegistration(registration: string) {
        const user = this.items.find((item) => item.registration_number === registration)

        if(!user){
            return null
        }

        return user
    }
    async create(data: CreateUserInput) {
        const user = {
            id: data.id ?? crypto.randomUUID(),
            name: data.name ?? null,
            email: data.email,
            password_hash: data.password_hash,
            role: data.role ?? 'user',
            registration_number: data.registration_number,
            created_at: new Date(),
            updated_at: new Date(),
        }

        this.items.push(user)

        return user
    }
    async getProfile(userId: string){
        const user = this.items.find((item) => item.id === userId)

        if (!user) {
            return { user: null }
        }

        return {
            user: {
            id: user.id,
            name: user.name ?? null, // garante compatibilidade
            email: user.email,
            registration_number: user.registration_number,
            role: user.role,
            },
        }
    }
}
