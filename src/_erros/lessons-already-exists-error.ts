export class LessonsAlreadyExistsError extends Error {
  constructor() {
    super('Já existe uma aula com esse nome para esse módulo.')
  }
}
