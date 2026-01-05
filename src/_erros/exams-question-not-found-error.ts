export class ExamsQuestionNotFoundError extends Error {
  constructor() {
    super('Questão não encontrada')
  }
}
