export class JourneysAlreadyExistsError extends Error {
  constructor() {
    super('Já existe uma jornada com esse nome para essa planta.')
  }
}
