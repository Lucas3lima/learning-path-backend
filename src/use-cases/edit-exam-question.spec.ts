import { beforeEach, describe, expect, it } from 'vitest'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { ExamsQuestionNotFoundError } from '../_erros/exams-question-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamQuestionsRepository } from '../repositories/in-memory/in-memory-exam-questions-repository.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { EditExamQuestionUseCase } from './edit-exam-question.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryExamQuestionsRepository: InMemoryExamQuestionsRepository

let sut: EditExamQuestionUseCase

describe('Edit Question Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryExamQuestionsRepository = new InMemoryExamQuestionsRepository()
    sut = new EditExamQuestionUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryExamQuestionsRepository,
    )
  })

  it('Should edit question', async () => {
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

    await inMemoryExamQuestionsRepository.create({
      id: '1',
      title: 'Pergunta 01',
      order: 1,
      examId: '01',
    })

    const { questionEdited } = await sut.execute({
      plantId: '1',
      journeySlug: 'journey',
      moduleSlug: 'module',
      examSlug: 'prova-final',
      questionId: '1',
      title: 'Pegunta 01 editada',
    })

    expect(questionEdited?.title).toEqual('Pegunta 01 editada')
  })

  it('Should not be able to edit a question for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'module',
        examSlug: 'prova-final',
        questionId: '1',
        title: 'Pegunta 01 editada',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to edit a question for a non-existing module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
        examSlug: 'prova-final',
        questionId: '1',
        title: 'Pegunta 01 editada',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('Should not be able to edit a question for a non-existing exam', async () => {
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

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
        examSlug: 'prova-final',
        questionId: '1',
        title: 'Pegunta 01 editada',
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
  it('Should not be able to edit a question for a non-existing question', async () => {
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

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova final',
      slug: 'prova-final',
      moduleId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '1',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
        examSlug: 'prova-final',
        questionId: '1',
        title: 'Pegunta 01 editada',
      }),
    ).rejects.toBeInstanceOf(ExamsQuestionNotFoundError)
  })
})
