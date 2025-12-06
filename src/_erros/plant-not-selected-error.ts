export class PlantNotSelectedError extends Error {
  constructor() {
    super('É necessário selecionar a planta.')
  }
}
