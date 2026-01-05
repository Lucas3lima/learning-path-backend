import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryExamAnswersRepository } from '../repositories/in-memory/in-memory-exam-answers-repository.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { GetExamsContentUseCase } from './get-exams-content.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository
let inMemoryExamAnswersRepository: InMemoryExamAnswersRepository
let sut: GetExamsContentUseCase

describe('Get all journeys Use Case', () => {
  beforeEach(async () => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    inMemoryExamAnswersRepository = new InMemoryExamAnswersRepository()
    sut = new GetExamsContentUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryExamQuestionsRepository,
      inMemoryExamAnswersRepository,
    )
  })

  it('Get all questions and answers in exam', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'journey',
      slug: 'journey',
      plantId: '01',
      responsibleId: '01',
      level: 'Advanced',
      description: 'description',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      journeyId: '01',
      hour: 2,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'Prova final',
      slug: 'prova-final',
      moduleId: '01',
      description: 'Descrição da prova..',
    })

    await inMemoryExamQuestionsRepository.create({
      id: '01',
      title: 'Pergunta 01',
      order: 1,
      examId: '01',
    })

    await inMemoryExamAnswersRepository.createMany([
      {
        title: 'P1 - Resposta 01',
        order: 1,
        isCorrect: false,
        questionId: '01',
      },
      {
        title: 'P1 - Resposta 02',
        order: 2,
        isCorrect: true,
        questionId: '01',
      },
    ])

    await inMemoryExamQuestionsRepository.create({
      id: '02',
      title: 'Pergunta 02',
      order: 2,
      examId: '01',
    })

    await inMemoryExamAnswersRepository.createMany([
      {
        title: 'P2 - Resposta 01',
        order: 1,
        isCorrect: false,
        questionId: '02',
      },
      {
        title: 'P2 - Resposta 02',
        order: 2,
        isCorrect: false,
        questionId: '02',
      },
      {
        title: 'P2 - Resposta 03',
        order: 3,
        isCorrect: true,
        questionId: '02',
      },
    ])

    await inMemoryExamQuestionsRepository.create({
      id: '03',
      title: 'Pergunta 03',
      order: 3,
      examId: '01',
    })

    await inMemoryExamAnswersRepository.createMany([
      {
        title: 'P3 - Resposta 01',
        order: 1,
        isCorrect: true,
        questionId: '03',
      },
      {
        title: 'P3 - Resposta 02',
        order: 2,
        isCorrect: false,
        questionId: '03',
      },
    ])

    const { exam, questions } = await sut.execute({
      plantId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module',
      examSlug: 'prova-final',
    })

    expect(exam.title).toEqual('Prova final')
    expect(exam.slug).toEqual('prova-final')
    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '01',
          title: 'Pergunta 01',
          order: 1,
          answers: expect.arrayContaining([
            expect.objectContaining({
              title: 'P1 - Resposta 01',
              order: 1,
              isCorrect: false,
            }),
            expect.objectContaining({
              title: 'P1 - Resposta 02',
              order: 2,
              isCorrect: true,
            }),
          ]),
        }),
        expect.objectContaining({
          id: '02',
          title: 'Pergunta 02',
          order: 2,
          answers: expect.arrayContaining([
            expect.objectContaining({
              title: 'P2 - Resposta 01',
              order: 1,
              isCorrect: false,
            }),
            expect.objectContaining({
              title: 'P2 - Resposta 02',
              order: 2,
              isCorrect: false,
            }),
            expect.objectContaining({
              title: 'P2 - Resposta 03',
              order: 3,
              isCorrect: true,
            }),
          ]),
        }),
        expect.objectContaining({
          id: '03',
          title: 'Pergunta 03',
          order: 3,
          answers: expect.arrayContaining([
            expect.objectContaining({
              title: 'P3 - Resposta 01',
              order: 1,
              isCorrect: true,
            }),
            expect.objectContaining({
              title: 'P3 - Resposta 02',
              order: 2,
              isCorrect: false,
            }),
          ]),
        }),
      ]),
    )
  })
})
