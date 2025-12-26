import { beforeEach, describe, expect, it } from 'vitest'
import { ExamsAlreadyExistsError } from '../_erros/exams-already-exists-error.ts'
import { ExamsNotFoundError } from '../_erros/exams-not-found-error.ts'
import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysAlreadyExistsError } from '../_erros/journeys-already-exists-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { EditExamsUseCase } from './edit-exams.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let sut: EditExamsUseCase

describe('Edit Exams Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    sut = new EditExamsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
    )
  })

  it('Should edit a exams', async () => {
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
      title: 'modulo',
      slug: 'modulo',
      journeyId: '01',
      order: 1,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'prova',
      slug: 'prova',
      moduleId: '01',
    })

    const { exam } = await sut.execute({
      id: '01',
      plantId: 'plant-01',
      title: 'Edit Exam 02',
      description: 'Description edit',
      journeySlug: 'journey',
      moduleSlug: 'modulo',
    })

    expect(exam.slug).toEqual('edit-exam-02')
    expect(exam.description).toEqual('Description edit')
  })

  it('Should not be able to edit a exam title to use a slug that already exists', async () => {
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
      title: 'modulo',
      slug: 'modulo',
      journeyId: '01',
      order: 1,
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'Prova Final',
      slug: 'prova-final',
      moduleId: '01',
    })
    await inMemoryExamsRepository.create({
      id: '02',
      title: 'Prova Final 2',
      slug: 'prova-final-2',
      moduleId: '01',
    })

    await expect(() =>
      sut.execute({
        id: '01',
        plantId: 'plant-01',
        title: 'Prova Final 2',
        description: 'Description edit',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
      }),
    ).rejects.toBeInstanceOf(ExamsAlreadyExistsError)
  })

  it('Should not be able to edit a exam for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        id: '01',
        plantId: 'plant-01',
        title: 'Prova Final 2',
        description: 'Description edit',
        journeySlug: 'non-existing',
        moduleSlug: 'modulo',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to edit a exam for a non-existing module', async () => {
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
        id: '01',
        plantId: 'plant-01',
        title: 'Prova Final 2',
        description: 'Description edit',
        journeySlug: 'journey',
        moduleSlug: 'non-existing',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('Should not be able to edit a exam for a non-existing exam', async () => {
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
      title: 'modulo',
      slug: 'modulo',
      journeyId: '01',
      order: 1,
    })

    await expect(() =>
      sut.execute({
        id: 'non-existing',
        plantId: 'plant-01',
        title: 'Prova Final 2',
        description: 'Description edit',
        journeySlug: 'journey',
        moduleSlug: 'modulo',
      }),
    ).rejects.toBeInstanceOf(ExamsNotFoundError)
  })
})
