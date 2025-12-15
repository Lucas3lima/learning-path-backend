import { beforeEach, describe, expect, it } from 'vitest'
import { ExamsAlreadyExistsError } from '../_erros/exams-already-exists-error.ts'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { CreateExamsUseCase } from './create-exams.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let sut: CreateExamsUseCase

describe('Create Exams Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()
    sut = new CreateExamsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryExamsRepository,
      inMemoryModuleContentsRepository,
    )
  })

  it('Should create a new exam', async () => {
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

    const { exam, moduleContent } = await sut.execute({
      title: 'New exam',
      journeySlug: 'journey',
      moduleSlug: 'module',
      plantId: '1',
      description: 'desc',
    })

    expect(exam.slug).toEqual('new-exam')
    expect(exam.moduleId).toEqual('01')
    expect(moduleContent.order).toEqual(1)
    expect(moduleContent.type).toEqual('exam')
  })

  it('Should not be able to create exam with a duplicate slug in the same module', async () => {
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

    await sut.execute({
      title: 'New exam',
      journeySlug: 'journey',
      moduleSlug: 'module',
      plantId: '1',
      description: 'desc',
    })

    await expect(() =>
      sut.execute({
        title: 'New exam',
        journeySlug: 'journey',
        moduleSlug: 'module',
        plantId: '1',
        description: 'desc',
      }),
    ).rejects.toBeInstanceOf(ExamsAlreadyExistsError)
  })

  it('Should not be able to create a exam for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        title: 'New exam',
        journeySlug: 'non-existing',
        moduleSlug: 'module',
        plantId: '1',
        description: 'desc',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to create a exam for a non-existing module', async () => {
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
        title: 'New exam',
        journeySlug: 'journey',
        moduleSlug: 'non-existing',
        plantId: '1',
        description: 'desc',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })

  it('Should allow creating exams with the same title in different modules', async () => {

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
      title: 'Module 01',
      slug: 'module-01',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '02',
      title: 'Module 02',
      slug: 'module-02',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const { exam: exam1 } = await sut.execute({
      title: 'repeated exam',
      journeySlug: 'journey',
      moduleSlug: 'module-01',
      plantId: '1',
      description: 'desc',
    })

    const { exam: exam2 } = await sut.execute({
      title: 'repeated exam',
      journeySlug: 'journey',
      moduleSlug: 'module-02',
      plantId: '1',
      description: 'desc',
    })

    expect(exam1.slug).toEqual('repeated-exam')
    expect(exam2.slug).toEqual('repeated-exam')

    expect(exam1.moduleId).toBe('01')
    expect(exam2.moduleId).toBe('02')

    // They MUST be allowed (no error thrown)
    expect(exam1.id).not.toBe(exam2.id)
  })
  it('Should allow creating exams with the same title in different modules', async () => {

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
      title: 'Module 01',
      slug: 'module-01',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '02',
      title: 'Module 02',
      slug: 'module-02',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const { exam: exam1 } = await sut.execute({
      title: 'repeated exam',
      journeySlug: 'journey',
      moduleSlug: 'module-01',
      plantId: '1',
      description: 'desc',
    })

    const { exam: exam2 } = await sut.execute({
      title: 'repeated exam',
      journeySlug: 'journey',
      moduleSlug: 'module-02',
      plantId: '1',
      description: 'desc',
    })

    expect(exam1.slug).toEqual('repeated-exam')
    expect(exam2.slug).toEqual('repeated-exam')

    expect(exam1.moduleId).toBe('01')
    expect(exam2.moduleId).toBe('02')

    // They MUST be allowed (no error thrown)
    expect(exam1.id).not.toBe(exam2.id)
  })

  it('Should increment order automatically in moduleContents', async () => {
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
      title: 'Module 01',
      slug: 'module-01',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const { moduleContent: mContent1 } = await sut.execute({
      title: 'exam 1',
      journeySlug: 'journey',
      moduleSlug: 'module-01',
      plantId: '1',
      description: 'desc',
    })

    const { moduleContent: mContent2 } = await sut.execute({
      title: 'exam 2',
      journeySlug: 'journey',
      moduleSlug: 'module-01',
      plantId: '1',
      description: 'desc',
    })
    expect(mContent1.type).toBe('exam')
    expect(mContent2.type).toBe('exam')
    expect(mContent1.order).toBe(1)
    expect(mContent2.order).toBe(2)

  })


})
