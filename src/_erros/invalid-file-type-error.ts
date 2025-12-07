export class InvalidFileTypeError extends Error {
  constructor() {
    super('Tipo de arquivo inválido, somente PDF é permitido.')
  }
}
