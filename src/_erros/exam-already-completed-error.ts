export class ExamAlreadyCompletedError extends Error {
  constructor() {
    super('A prova já foi concluída.')
  }
}
