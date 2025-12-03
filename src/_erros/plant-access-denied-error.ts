export class PlantAccessDeniedError extends Error {
  constructor() {
    super('Você não tem permissão para acessar esta planta.')
  }
}
