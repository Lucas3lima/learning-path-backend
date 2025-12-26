export class InvalidCorrectExamAnswerError extends Error {
  constructor() {
    super('Cada pergunta deve ter exatamente uma resposta correta.')
  }
}
