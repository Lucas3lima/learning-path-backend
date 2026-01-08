export class LessonAlreadyCompletedError extends Error {
  constructor() {
    super('A aula já foi concluída.')
  }
}
