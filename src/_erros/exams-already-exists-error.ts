export class ExamsAlreadyExistsError extends Error {
  constructor() {
    super('Já existe uma prova com esse nome para esse módulo.')
  }
}
