import { beforeEach, describe, expect, it } from 'vitest'
import { JourneysNotFoundError } from '../_erros/journeys-not-found-error.ts'
import { LessonAlreadyCompletedError } from '../_erros/lesson-already-completed-error.ts'
import { LessonLockedError } from '../_erros/lesson-locked-error.ts'
import { LessonsNotFoundError } from '../_erros/lessons-not-found-error.ts'
import { ModulesNotFoundError } from '../_erros/modules-not-found-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonProgressRepository } from '../repositories/in-memory/in-memory-lesson-progress-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModuleContentsRepository } from '../repositories/in-memory/in-memory-module-contents-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { CreateLessonProgresssUseCase } from './create-lesson-progress.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let inMemoryModuleContentsRepository: InMemoryModuleContentsRepository
let inMemoryLessonProgressRepository: InMemoryLessonProgressRepository
let sut: CreateLessonProgresssUseCase

describe('Create Lessons Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    inMemoryModuleContentsRepository = new InMemoryModuleContentsRepository()
    inMemoryLessonProgressRepository = new InMemoryLessonProgressRepository()

    sut = new CreateLessonProgresssUseCase(
      inMemoryJourneysRepository,
      inMemoryModulesRepository,
      inMemoryLessonsRepository,
      inMemoryModuleContentsRepository,
      inMemoryLessonProgressRepository,
    )
  })

  it('Should create a new lesson progress', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '02',
      title: 'Aula 02',
      slug: 'aula-02',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'lesson',
      lessonId: '02',
    })

    const { progress } = await sut.execute({
      plantId: '01',
      userId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module',
      lessonId: '01',
    })

    expect(progress.completed).toEqual(true)
    expect(progress.lessonId).toEqual('01')
  })
  it('Should not be able to create a new lesson progress with previous lesson not completed', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '02',
      title: 'Aula 02',
      slug: 'aula-02',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'lesson',
      lessonId: '02',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        lessonId: '02',
      }),
    ).rejects.toBeInstanceOf(LessonLockedError)
  })
  it('Should not be able to create a new lesson progress with lesson already completed', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '01',
      title: 'Aula 01',
      slug: 'aula-01',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '01',
      order: 1,
      moduleId: '01',
      type: 'lesson',
      lessonId: '01',
    })

    await inMemoryLessonsRepository.create({
      id: '02',
      title: 'Aula 02',
      slug: 'aula-02',
      moduleId: '01',
      content: 'Descrição',
      video_url: 'youtube.com',
    })

    await inMemoryModuleContentsRepository.create({
      id: '02',
      order: 2,
      moduleId: '01',
      type: 'lesson',
      lessonId: '02',
    })

    await sut.execute({
      plantId: '01',
      userId: '01',
      journeySlug: 'journey',
      moduleSlug: 'module',
      lessonId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        lessonId: '01',
      }),
    ).rejects.toBeInstanceOf(LessonAlreadyCompletedError)
  })

  it('Should not be able to create a lesson progress for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'non-existing',
        moduleSlug: 'module',
        lessonId: '01',
      }),
    ).rejects.toBeInstanceOf(JourneysNotFoundError)
  })

  it('Should not be able to create a lesson progess for a non-existing module', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'non-existing',
        lessonId: '01',
      }),
    ).rejects.toBeInstanceOf(ModulesNotFoundError)
  })
  it('Should not be able to create a lesson progess for a non-existing lesson', async () => {
    await inMemoryJourneysRepository.create({
      id: '01',
      title: 'Journey',
      slug: 'journey',
      description: 'Description...',
      level: 'Intermediate',
      responsibleId: 'resp-01',
      plantId: '01',
    })

    await inMemoryModulesRepository.create({
      id: '01',
      title: 'Module',
      slug: 'module',
      description: 'Description...',
      hour: 1,
      journeyId: '01',
    })

    await expect(() =>
      sut.execute({
        plantId: '01',
        userId: '01',
        journeySlug: 'journey',
        moduleSlug: 'module',
        lessonId: 'non-existing',
      }),
    ).rejects.toBeInstanceOf(LessonsNotFoundError)
  })
})
