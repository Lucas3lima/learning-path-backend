import { beforeEach, describe, expect, it } from 'vitest'
import { ExamAnswersLimitError } from '../_erros/exam-answers-limit-error.ts'
import { ExamsAlreadyExistsError } from '../_erros/exams-already-exists-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { InvalidCorrectExamAnswerError } from '../_erros/invalid-correct-exam-answer-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamAnswersRepository } from '../repositories/in-memory/in-memory-exam-answers-repository.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { CreateQuestionsAndAnswersUseCase } from './create-questions-and-answers.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository
let inMemoryExamAnswersRepository: InMemoryExamAnswersRepository

let sut: CreateQuestionsAndAnswersUseCase

describe('Create Questions and Answers Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    inMemoryExamAnswersRepository = new InMemoryExamAnswersRepository()
    sut = new CreateQuestionsAndAnswersUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryExamQuestionsRepository,
      inMemoryExamAnswersRepository,
    )
  })

  it('Should create a new question and answers', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: false,
      },
      {
        title: 'Resposta 03',
        isCorrect: true,
      },
    ]

    const { question, createdAnswers } = await sut.execute({
      plantId: '1',
      journeySlug: 'journey',
      moduleSlug: 'module',
      examId: '01',
      title: 'Pergunta 01',
      answers: answersExemples,
    })

    expect(question.title).toEqual('Pergunta 01')
    expect(question.order).toEqual(1)
    expect(question.examId).toEqual('01')
    expect(createdAnswers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Resposta 01',
          order: 1,
          isCorrect: false,
          questionId: question.id,
        }),
        expect.objectContaining({
          title: 'Resposta 02',
          order: 2,
          isCorrect: false,
          questionId: question.id,
        }),
        expect.objectContaining({
          title: 'Resposta 03',
          order: 3,
          isCorrect: true,
          questionId: question.id,
        }),
      ]),
    )
  })

  it('Should not be able to create a questions and answers for a non-existing journey', async () => {
    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: false,
      },
      {
        title: 'Resposta 03',
        isCorrect: true,
      },
    ]
    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'non-existing',
        moduleSlug: 'module',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to create a questions and answers for a non-existing module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })
    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: false,
      },
      {
        title: 'Resposta 03',
        isCorrect: true,
      },
    ]
    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'non-existing',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('Should not be able to create a questions and answers for a non-existing exam', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'modulo',
      slug: 'modulo',
      journeyId: '01',
    })
    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: false,
      },
      {
        title: 'Resposta 03',
        isCorrect: true,
      },
    ]
    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })

  it('Should not be possible to create a question with fewer than two answers', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
    ]

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(ExamAnswersLimitError)
  })
  it('Should not be possible to create a question with more than five answers', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: true,
      },
      {
        title: 'Resposta 03',
        isCorrect: false,
      },
      {
        title: 'Resposta 04',
        isCorrect: false,
      },
      {
        title: 'Resposta 05',
        isCorrect: false,
      },
      {
        title: 'Resposta 06',
        isCorrect: false,
      },
    ]

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(ExamAnswersLimitError)
  })
  it('Should not be possible to create a question with no correct answers', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: false,
      },
      {
        title: 'Resposta 03',
        isCorrect: false,
      },
      {
        title: 'Resposta 04',
        isCorrect: false,
      },
      {
        title: 'Resposta 05',
        isCorrect: false,
      },
    ]

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(InvalidCorrectExamAnswerError)
  })
  it('Should not be possible to create a question with more than one correct answers', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    const answersExemples = [
      {
        title: 'Resposta 01',
        isCorrect: false,
      },
      {
        title: 'Resposta 02',
        isCorrect: true,
      },
      {
        title: 'Resposta 03',
        isCorrect: false,
      },
      {
        title: 'Resposta 04',
        isCorrect: true,
      }
    ]

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examId: '01',
        title: 'Pergunta 01',
        answers: answersExemples,
      }),
    ).rejects.toBeInstanceOf(InvalidCorrectExamAnswerError)
  })
})
