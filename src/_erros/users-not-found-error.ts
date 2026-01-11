export class UsersNotFoundError extends Error {
  constructor() {
    super('Usuário não encontrado !')
  }
}
