export class IncompleteExamError extends Error {
  constructor() {
    super('É necessário responder todas as perguntas da prova.')
  }
}
