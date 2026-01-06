export class ExamAnswersLimitError extends Error {
  constructor() {
    super('Cada pergunta deve ter no mínimo 2 e no máximo 5 respostas.')
  }
}
