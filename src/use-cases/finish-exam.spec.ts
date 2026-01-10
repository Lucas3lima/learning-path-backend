import { beforeEach, describe, expect, it } from 'vitest'
import { DuplicateExamQuestionAnswerError } from '../_erros/duplicate-exam-question-answer-error.ts'
import { ExamAlreadyCompletedError } from '../_erros/exam-already-completed-error.ts'
import { ExamNotStartedError } from '../_erros/exam-not-started-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { IncompleteExamError } from '../_erros/incomplete-exam-error.ts'
import { InMemoryExamAnswersRepository } from '../repositories/in-memory/in-memory-exam-answers-repository.ts'
import { InMemoryExamAttemptsRepository } from '../repositories/in-memory/in-memory-exam-attempts-repository.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonProgressRepository } from '../repositories/in-memory/in-memory-lesson-progress-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { FinishExamUseCase } from './finish-exam.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository
let inMemoryExamAnswersRepository: InMemoryExamAnswersRepository
let inMemoryLessonProgressRepository: InMemoryLessonProgressRepository
let inMemoryExamAttemptsRepository: InMemoryExamAttemptsRepository

let inMemoryLessonsRepository: InMemoryLessonsRepository

let sut: FinishExamUseCase

describe('Finish exam Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    inMemoryExamAnswersRepository = new InMemoryExamAnswersRepository()
    inMemoryExamAttemptsRepository = new InMemoryExamAttemptsRepository()

    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    inMemoryLessonProgressRepository = new InMemoryLessonProgressRepository()

    sut = new FinishExamUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryModuleContentsRepository,
      inMemoryExamQuestionsRepository,
      inMemoryExamAnswersRepository,
      inMemoryExamAttemptsRepository,
    )
  })

  it('Should finish an exam and completed', async () => {
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
      userId: '01',
      examId: '01',
    })

    const { score, approved, totalQuestions, correctAnswers, results } =
      await sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '02', answerId: '04' },
        ],
      })

    if (results) {
      expect(score).toEqual(100)
      expect(approved).toEqual(true)
      expect(totalQuestions).toEqual(2)
      expect(correctAnswers).toEqual(2)
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            questionId: '01',
            selectedAnswerId: '02',
            correctAnswerId: '02',
            isCorrect: true,
          }),
          expect.objectContaining({
            questionId: '02',
            selectedAnswerId: '04',
            correctAnswerId: '04',
            isCorrect: true,
          }),
        ]),
      )
    }
  })
  it('Should finish an exam and not complete it due to insufficient score', async () => {
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
    // cria a pergunta 3
    await inMemoryExamQuestionsRepository.create({
      id: '03',
      examId: '01',
      order: 3,
      title: 'Pergunta 3',
    })
    // cria as respostas da pergunta 3
    await inMemoryExamAnswersRepository.createMany([
      {
        id: '06',
        title: 'resposta 1',
        order: 1,
        questionId: '03',
        isCorrect: true,
      },
      {
        id: '07',
        title: 'resposta 2',
        order: 2,
        questionId: '03',
        isCorrect: false,
      },
      {
        id: '08',
        title: 'resposta 3',
        order: 3,
        questionId: '03',
        isCorrect: false,
      },
    ])

    await inMemoryExamAttemptsRepository.create({
      id: '01',
      userId: '01',
      examId: '01',
    })

    const { score, approved, totalQuestions, correctAnswers } =
      await sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '02', answerId: '03' },
          { questionId: '03', answerId: '07' },
        ],
      })
    expect(score).toEqual(33)
    expect(approved).toEqual(false)
    expect(totalQuestions).toEqual(3)
    expect(correctAnswers).toEqual(1)
  })

  it('Should not be able to finish an exam with exam already completed', async () => {
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
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '02', answerId: '03' },
        ],
      }),
    ).rejects.toBeInstanceOf(ExamAlreadyCompletedError)
  })
  it('Should not be able to finish an exam with questions not found', async () => {
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

    await inMemoryExamAttemptsRepository.create({
      examId: '01',
      userId: '01',
      id: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '02', answerId: '03' },
        ],
      }),
    ).rejects.toBeInstanceOf(ExamsQuestionNotFoundError)
  })
  it('Should not be able to finish an exam that was not started', async () => {
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
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '02', answerId: '03' },
        ],
      }),
    ).rejects.toBeInstanceOf(ExamNotStartedError)
  })

  it('Should not be able to finish an exam with questions that do not belong to the exam', async () => {
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
      examId: '01',
      userId: '01',
      id: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [
          { questionId: '03', answerId: '02' },
          { questionId: '02', answerId: '03' },
        ],
      }),
    ).rejects.toBeInstanceOf(ExamsQuestionNotFoundError)
  })
  it('Should not be able to finish an exam with duplicate questions', async () => {
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
      examId: '01',
      userId: '01',
      id: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [
          { questionId: '01', answerId: '02' },
          { questionId: '01', answerId: '02' },
        ],
      }),
    ).rejects.toBeInstanceOf(DuplicateExamQuestionAnswerError)
  })
  it('Should not be able to finish an exam without answering all questions', async () => {
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
      examId: '01',
      userId: '01',
      id: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        answers: [{ questionId: '01', answerId: '02' }],
      }),
    ).rejects.toBeInstanceOf(IncompleteExamError)
  })
})
