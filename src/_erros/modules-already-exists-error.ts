export class ModulesAlreadyExistsError extends Error {
  constructor() {
    super('Já existe um módulo com esse nome para essa trilha.')
  }
}
