import { beforeEach, describe, expect, it } from 'vitest'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { CreateLessonsUseCase } from './create-lessons.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let sut: CreateLessonsUseCase

describe('Create Lessons Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    sut = new CreateLessonsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryLessonsRepository,
    )
  })

  it('Should create a new lesson', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
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
      plantId: 'plant-01',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    expect(lesson.order).toEqual(1)
    expect(lesson.slug).toEqual('new-lesson')
    expect(lesson.moduleId).toEqual('01')
  })

  it('Should not be able to create lesson with a duplicate slug in the same module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
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
      plantId: 'plant-01',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: 'plant-01',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(LessonsAlreadyExistsError)
  })

  it('Should not be able to create a lesson for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: 'plant-01',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('Should not be able to create a lesson for a non-existing module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
    })
    
    await expect(() =>
      sut.execute({
        title: 'New Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'new_module',
        plantId: 'plant-01',
        video_url: 'www.youtube.com',
        content: 'content...',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

    it('Should increment order automatically', async () => {
      await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
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
      plantId: 'plant-01',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

      const { lesson } = await sut.execute({
      title: 'New Lesson 02',
      journeySlug: 'new_journey',
      moduleSlug: 'new_module',
      plantId: 'plant-01',
      video_url: 'www.youtube.com',
      content: 'content...',
    })

      expect(lesson.order).toEqual(2)
    })

    it('Should allow creating lessons with the same title in different modules', async () => {
      await inMemoryJourneysRepository.create({
      id: '01',
      title: 'New Journey',
      slug: 'new_journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: 'plant-01',
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
        plantId: 'plant-01',
        video_url: 'www.youtube.com',
        content: 'content...',
      })

      const { lesson: lesson2 } = await sut.execute({
        title: 'Repeated Lesson',
        journeySlug: 'new_journey',
        moduleSlug: 'module_02',
        plantId: 'plant-01',
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
})
