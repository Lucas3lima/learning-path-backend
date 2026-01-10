export class ExamLockedError extends Error {
  constructor() {
    super('Conclua a prova anterior para desbloquear.')
  }
}
