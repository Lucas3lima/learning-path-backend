export class DuplicateExamQuestionAnswerError extends Error {
  constructor() {
    super('A mesma pergunta foi respondida mais de uma vez.')
  }
}
