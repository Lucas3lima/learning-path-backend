import { beforeEach, describe, expect, it } from 'vitest'
import { LessonsAlreadyExistsError } from '../_erros/lessons-already-exists-error.ts'
import { NotFoundError } from '../_erros/not-found-error.ts'
import { InMemoryJourneysRepository } from '../repositories/in-memory/in-memory-journeys-repository.ts'
import { InMemoryLessonsRepository } from '../repositories/in-memory/in-memory-lessons-repository.ts'
import { InMemoryModulesRepository } from '../repositories/in-memory/in-memory-modules-repository.ts'
import { EditLessonsUseCase } from './edit-lessons.ts'

let inMemoryJourneysRepository: InMemoryJourneysRepository
let inMemoryModulesRepository: InMemoryModulesRepository
let inMemoryLessonsRepository: InMemoryLessonsRepository
let sut: EditLessonsUseCase

describe('Edit lessons Use Case', () => {
  beforeEach(() => {
    inMemoryJourneysRepository = new InMemoryJourneysRepository()
    inMemoryModulesRepository = new InMemoryModulesRepository()
    inMemoryLessonsRepository = new InMemoryLessonsRepository()
    sut = new EditLessonsUseCase(
      inMemoryModulesRepository,
      inMemoryJourneysRepository,
      inMemoryLessonsRepository,
    )
  })

  it('Should edit a lesson', async () => {
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
      journeyId: '01',
      title: 'modulo 01',
      slug: 'modulo-01',
      hour: 10,
    })

    await inMemoryLessonsRepository.create({
      id: '01',
      moduleId: '01',
      title: 'aula 01',
      slug: 'aula-01',
      content: 'desc',
      video_url: 'www.youtube.com',
    })

    const { lesson } = await sut.execute({
      id: '01',
      journeySlug: 'journey',
      moduleSlug: 'modulo-01',
      title: 'aula 02',
      content: 'desc edit',
      video_url: 'www.youtube.com/channel',
      plantId: 'plant-01',
    })

    expect(lesson.slug).toEqual('aula-02')
    expect(lesson.content).toEqual('desc edit')
    expect(lesson.video_url).toEqual('www.youtube.com/channel')
  })

  it('Should not be able to edit a lesson title to use a slug that already exists', async () => {
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
      journeyId: '01',
      title: 'modulo 01',
      slug: 'modulo-01',
      hour: 10,
    })

    await inMemoryLessonsRepository.create({
      id: '01',
      moduleId: '01',
      title: 'aula 01',
      slug: 'aula-01',
      content: 'desc',
      video_url: 'www.youtube.com',
    })
    await inMemoryLessonsRepository.create({
      id: '02',
      moduleId: '01',
      title: 'aula 02',
      slug: 'aula-02',
      content: 'desc',
      video_url: 'www.youtube.com',
    })

    await expect(() =>
      sut.execute({
        id: '01',
        journeySlug: 'journey',
        moduleSlug: 'modulo-01',
        title: 'aula 02',
        content: 'desc edit',
        video_url: 'www.youtube.com/channel',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(LessonsAlreadyExistsError)
  })

  it('Should not be able to edit a lessons for a non-existing journey', async () => {
    await expect(() =>
      sut.execute({
        id: '01',
        journeySlug: 'non-existing',
        moduleSlug: 'modulo-01',
        title: 'aula 02',
        content: 'desc edit',
        video_url: 'www.youtube.com/channel',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
  it('Should not be able to edit a lessons for a non-existing module', async () => {
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
        journeySlug: 'journey',
        moduleSlug: 'non-existing',
        title: 'aula 02',
        content: 'desc edit',
        video_url: 'www.youtube.com/channel',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
  it('Should not be able to edit a lessons for a non-existing lesson', async () => {
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
      journeyId: '01',
      title: 'modulo 01',
      slug: 'modulo-01',
      hour: 10,
    })
    
    await expect(() =>
      sut.execute({
        id: 'non-existing',
        journeySlug: 'journey',
        moduleSlug: 'modulo-01',
        title: 'aula 02',
        content: 'desc edit',
        video_url: 'www.youtube.com/channel',
        plantId: 'plant-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
