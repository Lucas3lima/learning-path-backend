export class LessonLockedError extends Error {
  constructor() {
    super('Conclua a aula anterior para desbloquear.')
  }
}
