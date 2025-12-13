import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { ListModuleLessonsUseCase } from './list-module-lessons.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let sut: ListModuleLessonsUseCase

describe('Get all journeys Use Case', () => {
  beforeEach(async () => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    sut = new ListModuleLessonsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryLessonsRepository,
    )
  })

  it('Get all lessons in module', async () => {
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
      title: 'Module 01',
      slug: 'module-01',
      journeyId: '01',
      hour: 2,
    })
    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'lesson 1',
      slug: 'lesson-1',
      moduleId:'01',
      video_url: 'www.youtube.com'
    })
    await inMemoryLessonsRepository.create({
      id: '02',
      title: 'lesson 2',
      slug: 'lesson-2',
      moduleId:'01',
      pdf_url: 'uploads/plant/journey/module/exemplo.pdf'
    })

    const response = await sut.execute({
      plantId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module-01'
    })

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '01',
          title: 'lesson 1',
          slug: 'lesson-1',
          order: 1,
          content: null,
          video_url: 'www.youtube.com',
          pdf_url: null
        }),
        expect.objectContaining({
          id: '02',
          title: 'lesson 2',
          slug: 'lesson-2',
          order: 2,
          content: null,
          video_url: null,
          pdf_url: 'uploads/plant/journey/module/exemplo.pdf'
        }),
      ]),
    )
  })
})
