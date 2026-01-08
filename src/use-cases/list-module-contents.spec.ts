import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryExamsRepository } from '../repositories/in-memory/in-memory-exams-repository.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonProgressRepository } from '../repositories/in-memory/in-memory-lesson-progress-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { ListModuleContentsUseCase } from './list-module-contents.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let inMemoryExamsRepository: InMemoryExamsRepository
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let inMemoryLessonProgressRepository: InMemoryLessonProgressRepository
let sut: ListModuleContentsUseCase

describe('Get all journeys Use Case', () => {
  beforeEach(async () => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    inMemoryExamsRepository = new InMemoryExamsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()
    inMemoryLessonProgressRepository = new InMemoryLessonProgressRepository()
    sut = new ListModuleContentsUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryLessonsRepository,
      inMemoryExamsRepository,
      inMemoryModuleContentsRepository,
      inMemoryLessonProgressRepository,
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
      moduleId: '01',
      video_url: 'www.youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '01',
      type: 'lesson',
      moduleId: '01',
      order: 1,
      lessonId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '02',
      title: 'lesson 2',
      slug: 'lesson-2',
      moduleId: '01',
      pdf_url: 'uploads/plant/journey/module/exemplo.pdf',
    })

    await inMemoryModuleContentsRepository.create({
      id: '02',
      type: 'lesson',
      moduleId: '01',
      order: 2,
      lessonId: '02',
    })

    await inMemoryExamsRepository.create({
      id: '01',
      title: 'Prova final',
      slug: 'prova-final',
      moduleId: '01',
      description: 'Descrição da prova',
    })

    await inMemoryModuleContentsRepository.create({
      id: '03',
      type: 'exam',
      moduleId: '01',
      order: 3,
      examId: '01',
    })
    const response = await sut.execute({
      plantId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module-01',
      userId: '01',
    })

    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '01',
          title: 'lesson 1',
          slug: 'lesson-1',
          description: null,
          content: null,
          video_url: 'www.youtube.com',
          pdf_url: null,
          order: 1,
          type: 'lesson',
          completed: false,
          locked: false,
        }),
        expect.objectContaining({
          id: '02',
          title: 'lesson 2',
          slug: 'lesson-2',
          description: null,
          content: null,
          video_url: null,
          pdf_url: 'uploads/plant/journey/module/exemplo.pdf',
          order: 2,
          type: 'lesson',
          completed: false,
          locked: true,
        }),
        expect.objectContaining({
          id: '01',
          title: 'Prova final',
          slug: 'prova-final',
          description: 'Descrição da prova',
          content: null,
          video_url: null,
          pdf_url: null,
          order: 3,
          type: 'exam',
          completed: false,
          locked: true,
        }),
      ]),
    )
  })
})
