export class ExamNotStartedError extends Error {
  constructor() {
    super('A prova não foi iniciada. Por favor inicie a prova para depois termina-la.')
  }
}
