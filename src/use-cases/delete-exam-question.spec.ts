import { beforeEach, describe, expect, it } from 'vitest'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { DeleteExamQuestionUseCase } from './delete-exam-question.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository
let sut: DeleteExamQuestionUseCase

describe('Delete Exam Question Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    sut = new DeleteExamQuestionUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryExamQuestionsRepository,
    )
  })

  it('Should delete a exam question', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'module',
      slug: 'module',
      journeyId: '01',
      order: 1,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })

    await inMemoryExamQuestionsRepository.create({
      id: '01',
      title: 'Questao 01',
      examId: '01',
      order: 1,
    })

    const { questionDeleted } = await sut.execute({
      plantId: 'plant-01',
      journeySlug: 'journey',
      moduleSlug: 'module',
      examSlug: 'prova',
      questionId: '01',
    })

    expect(questionDeleted).toEqual(true)
  })

  it('should not be able to delete a exam question with the wrong journeySlug', async () => {
    await expect(() =>
      sut.execute({
        plantId: 'plant-01',
        journeySlug: 'wrong-journeySlug',
        moduleSlug: 'module',
        examSlug: 'prova',
        questionId: '01',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })
  it('should not be able to delete a exam question with the wrong moduleSlug', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await expect(() =>
      sut.execute({
        plantId: 'plant-01',
        journeySlug: 'journey',
        moduleSlug: 'wrong-moduleSlug',
        examSlug: '01',
        questionId: '01',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('should not be able to delete a exam question with the wrong examSlug', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'module',
      slug: 'module',
      journeyId: '01',
      order: 1,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: 'plant-01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examSlug: 'wrong-examSlug',
        questionId: '01',
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
  it('should not be able to delete a exam question with the wrong questionId', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'module',
      slug: 'module',
      journeyId: '01',
      order: 1,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: 'plant-01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examSlug: 'prova',
        questionId: '01',
      }),
    ).rejects.toBeInstanceOf(ExamsQuestionNotFoundError)
  })
})
