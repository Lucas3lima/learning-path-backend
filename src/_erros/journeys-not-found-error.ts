export class JourneysNotFoundError extends Error {
  constructor() {
    super('Trilha não encontrada !')
  }
}
