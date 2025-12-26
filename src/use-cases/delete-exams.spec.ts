import { beforeEach, describe, expect, it } from 'vitest'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { DeleteExamsUseCase } from './delete-exams.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let sut: DeleteExamsUseCase

describe('Delete Exams Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    sut = new DeleteExamsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
    )
  })

  it('Should delete a exam', async () => {
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

    const { deleted } = await sut.execute({
      id: '01',
      plantId: 'plant-01',
      journeySlug: 'journey',
      moduleSlug: 'module',
    })

    expect(deleted).toEqual(true)
  })

  it('should not be able to delete a journey with the wrong journeySlug', async () => {
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
        id: '01',
        plantId: 'plant-01',
        journeySlug: 'wrong-journeySlug',
        moduleSlug: 'module',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })
  it('should not be able to delete a journey with the wrong moduleSlug', async () => {
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
        id: '01',
        plantId: 'plant-01',
        journeySlug: 'journey',
        moduleSlug: 'wrong-moduleSlug',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('should not be able to delete a journey with the wrong examId', async () => {
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
        id: 'wrong id',
        plantId: 'plant-01',
        journeySlug: 'journey',
        moduleSlug: 'module',
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
})
