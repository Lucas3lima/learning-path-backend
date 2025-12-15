import { Readable } from 'node:stream'
import { beforeEach, describe, expect, it } from 'vitest'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { FakeStorageProvider } from '../repositories/disk-storage/fake-storage-provider.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { InMemoryPlantsRepository } from '../repositories/in-memory/in-memory-plants-repository.ts'
import { CreateLessonsUseCase } from './create-lessons.ts'

function makeFakeFile(content: string, mimetype = 'application/pdf') {
  return {
    stream: Readable.from([content]),
    mimetype,
  }
}

let inMemoryPlantsRepository: InMemoryPlantsRepository
let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let fakeStorageProvider: FakeStorageProvider
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let sut: CreateLessonsUseCase

describe('Create Lessons Use Case', () => {
  beforeEach(() => {
    inMemoryPlantsRepository = new InMemoryPlantsRepository()
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()

    fakeStorageProvider = new FakeStorageProvider()
    sut = new CreateLessonsUseCase(
      inMemoryPlantsRepository,
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryLessonsRepository,
      fakeStorageProvider,
      inMemoryModuleContentsRepository,
    )
  })

  it('Should create a new lesson', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'New Module',
      slug: 'new_module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const { lesson } = await sut.execute({
      title: 'New Lesson',
      journeySlug: 'new_journey',
      moduleSlug: 'new_module',
      plantId: '1',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    expect(lesson.slug).toEqual('new-lesson')
    expect(lesson.moduleId).toEqual('01')
  })

  it('Should not be able to create lesson with a duplicate slug in the same module', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'New Module',
      slug: 'new_module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await sut.execute({
      title: 'New Lesson',
      journeySlug: 'new_journey',
      moduleSlug: 'new_module',
      plantId: '1',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: '1',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(LessonsAlreadyExistsError)
  })

  it('Should not be able to create a lesson for a non-existing journey', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: '1',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to create a lesson for a non-existing module', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: '1',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })

  it('Should allow creating lessons with the same title in different modules', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module 01',
      slug: 'module_01',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '02',
      title: 'Module 02',
      slug: 'module_02',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const { lesson: lesson1 } = await sut.execute({
      title: 'Repeated Lesson',
      journeySlug: 'new_journey',
      moduleSlug: 'module_01',
      plantId: '1',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    const { lesson: lesson2 } = await sut.execute({
      title: 'Repeated Lesson',
      journeySlug: 'new_journey',
      moduleSlug: 'module_02',
      plantId: '1',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    expect(lesson1.slug).toEqual('repeated-lesson')
    expect(lesson2.slug).toEqual('repeated-lesson')

    expect(lesson1.moduleId).toBe('01')
    expect(lesson2.moduleId).toBe('02')

    // They MUST be allowed (no error thrown)
    expect(lesson1.id).not.toBe(lesson2.id)
  })

  it('Should save lesson PDF file', async () => {
    await inMemoryPlantsRepository.create({
      id: '1',
      name: 'Test plant',
      slug: 'test_plant',
      country_id: '1',
    })

    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '1',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'New Module',
      slug: 'new_module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    const fakeStream = makeFakeFile('PDF CONTENT HERE')

    // Act
    const { lesson } = await sut.execute({
      title: 'Lesson With File',
      journeySlug: 'new_journey',
      moduleSlug: 'new_module',
      plantId: '1',
      file: fakeStream, // simulação
    })

    // Assert
    expect(lesson.pdf_url).toContain('fake/')
    expect(Object.keys(fakeStorageProvider.files).length).toBe(1)
  })
})
