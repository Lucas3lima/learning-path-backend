import { beforeEach, describe, expect, it } from 'vitest'
import { ExamAlreadyCompletedError } from '../_erros/exam-already-completed-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonLockedError } from '../_erros/lesson-locked-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamAnswersRepository } from '../repositories/in-memory/in-memory-exam-answers-repository.ts'
import { InMemoryExamAttemptsRepository } from '../repositories/in-memory/in-memory-exam-attempts-repository.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonProgressRepository } from '../repositories/in-memory/in-memory-lesson-progress-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { StartExamUseCase } from './start-exam.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository
let inMemoryExamAnswersRepository: InMemoryExamAnswersRepository
let inMemoryLessonProgressRepository: InMemoryLessonProgressRepository
let inMemoryExamAttemptsRepository: InMemoryExamAttemptsRepository

let inMemoryLessonsRepository: InMemoryLessonsRepository

let sut: StartExamUseCase

describe('Start exam Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    inMemoryExamAnswersRepository = new InMemoryExamAnswersRepository()
    inMemoryLessonProgressRepository = new InMemoryLessonProgressRepository()
    inMemoryExamAttemptsRepository = new InMemoryExamAttemptsRepository()

    inMemoryLessonsRepository = new InMemoryLessonsRepository()

    sut = new StartExamUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryModuleContentsRepository,
      inMemoryExamQuestionsRepository,
      inMemoryExamAnswersRepository,
      inMemoryLessonProgressRepository,
      inMemoryExamAttemptsRepository,
    )
  })

  it('Should start a new exam', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })
    // cria o módulo
    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })
    // cria uma aula
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })
    // coloca a aula nos contents
    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })
    // marca a aula como vista
    await inMemoryLessonProgressRepository.create({
      id: '01',
      lessonId: '01',
      userId: '01',
      completed: true,
    })

    // cria a prova
    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })
    // coloca a prova nos contents
    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'exam',
      examId: '01',
    })
    // cria a pergunta 1
    await inMemoryExamQuestionsRepository.create({
      id: '01',
      examId: '01',
      order: 1,
      title: 'Pergunta 1',
    })
    // cria as respostas da pergunta 1
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '01',
        title: 'resposta 1',
        order: 1,
        questionId: '01',
        isCorrect: false,
      },
      {
        id: '02',
        title: 'resposta 2',
        order: 2,
        questionId: '01',
        isCorrect: true,
      },
    ])
    // cria a pergunta 2
    await inMemoryExamQuestionsRepository.create({
      id: '02',
      examId: '01',
      order: 2,
      title: 'Pergunta 2',
    })
    // cria as respostas da pergunta 2
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '03',
        title: 'resposta 1',
        order: 1,
        questionId: '02',
        isCorrect: false,
      },
      {
        id: '04',
        title: 'resposta 2',
        order: 2,
        questionId: '02',
        isCorrect: true,
      },
      {
        id: '05',
        title: 'resposta 3',
        order: 3,
        questionId: '02',
        isCorrect: false,
      },
    ])

    const { exam, questions } = await sut.execute({
      plantId: '01',
      userId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module',
      examId: '01',
    })

    if (exam && questions) {
      expect(exam.id).toEqual('01')
      expect(exam.title).toEqual('prova')

      expect(questions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '01',
            title: 'Pergunta 1',
            order: 1,
            answers: expect.arrayContaining([
              expect.objectContaining({
                id: '01',
                title: 'resposta 1',
                order: 1,
              }),
              expect.objectContaining({
                id: '02',
                title: 'resposta 2',
                order: 2,
              }),
            ]),
          }),
          expect.objectContaining({
            id: '02',
            title: 'Pergunta 2',
            order: 2,
            answers: expect.arrayContaining([
              expect.objectContaining({
                id: '03',
                title: 'resposta 1',
                order: 1,
              }),
              expect.objectContaining({
                id: '04',
                title: 'resposta 2',
                order: 2,
              }),
              expect.objectContaining({
                id: '05',
                title: 'resposta 3',
                order: 3,
              }),
            ]),
          }),
        ]),
      )
    }
  })

  it('Should not be able to start a new exam with previous lesson not completed', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })
    // cria o módulo
    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })
    // cria uma aula
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })
    // coloca a aula nos contents
    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })

    // cria a prova
    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })
    // coloca a prova nos contents
    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'exam',
      examId: '01',
    })
    // cria a pergunta 1
    await inMemoryExamQuestionsRepository.create({
      id: '01',
      examId: '01',
      order: 1,
      title: 'Pergunta 1',
    })
    // cria as respostas da pergunta 1
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '01',
        title: 'resposta 1',
        order: 1,
        questionId: '01',
        isCorrect: false,
      },
      {
        id: '02',
        title: 'resposta 2',
        order: 2,
        questionId: '01',
        isCorrect: true,
      },
    ])
    // cria a pergunta 2
    await inMemoryExamQuestionsRepository.create({
      id: '02',
      examId: '01',
      order: 2,
      title: 'Pergunta 2',
    })
    // cria as respostas da pergunta 2
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '03',
        title: 'resposta 1',
        order: 1,
        questionId: '02',
        isCorrect: false,
      },
      {
        id: '04',
        title: 'resposta 2',
        order: 2,
        questionId: '02',
        isCorrect: true,
      },
      {
        id: '05',
        title: 'resposta 3',
        order: 3,
        questionId: '02',
        isCorrect: false,
      },
    ])

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(LessonLockedError)
  })
  it('Should not be able to start a new exam with exam already completed', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })
    // cria o módulo
    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })
    // cria uma aula
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })
    // coloca a aula nos contents
    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })
    // marca a aula como vista
    await inMemoryLessonProgressRepository.create({
      id: '01',
      lessonId: '01',
      userId: '01',
      completed: true,
    })

    // cria a prova
    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })
    // coloca a prova nos contents
    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'exam',
      examId: '01',
    })

    // cria a pergunta 1
    await inMemoryExamQuestionsRepository.create({
      id: '01',
      examId: '01',
      order: 1,
      title: 'Pergunta 1',
    })
    // cria as respostas da pergunta 1
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '01',
        title: 'resposta 1',
        order: 1,
        questionId: '01',
        isCorrect: false,
      },
      {
        id: '02',
        title: 'resposta 2',
        order: 2,
        questionId: '01',
        isCorrect: true,
      },
    ])
    // cria a pergunta 2
    await inMemoryExamQuestionsRepository.create({
      id: '02',
      examId: '01',
      order: 2,
      title: 'Pergunta 2',
    })
    // cria as respostas da pergunta 2
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '03',
        title: 'resposta 1',
        order: 1,
        questionId: '02',
        isCorrect: false,
      },
      {
        id: '04',
        title: 'resposta 2',
        order: 2,
        questionId: '02',
        isCorrect: true,
      },
      {
        id: '05',
        title: 'resposta 3',
        order: 3,
        questionId: '02',
        isCorrect: false,
      },
    ])

    await inMemoryExamAttemptsRepository.create({
      id: '01',
      examId: '01',
      userId: '01',
    })

    await inMemoryExamAttemptsRepository.finishAttempt('01', 100, true)

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(ExamAlreadyCompletedError)
  })
  it('Should not be able to start a new exam with questions not found', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })
    // cria o módulo
    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })
    // cria uma aula
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })
    // coloca a aula nos contents
    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })
    // marca a aula como vista
    await inMemoryLessonProgressRepository.create({
      id: '01',
      lessonId: '01',
      userId: '01',
      completed: true,
    })

    // cria a prova
    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })
    // coloca a prova nos contents
    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'exam',
      examId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(ExamsQuestionNotFoundError)
  })
  it('Should not be able to start a new exam with exam not found', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })
    // cria o módulo
    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })
    // cria uma aula
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })
    // coloca a aula nos contents
    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })
    // marca a aula como vista
    await inMemoryLessonProgressRepository.create({
      id: '01',
      lessonId: '01',
      userId: '01',
      completed: true,
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
  it('Should not be able to start a new exam with module not found', async () => {
    // CRIA A JOURNEY
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('Should not be able to start a new exam with journey not found', async () => {
    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journeys',
        moduleSlug: 'module',
        examId: '01',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })
  
})
