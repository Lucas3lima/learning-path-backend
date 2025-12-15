import { GenericEditingError } from '../_erros/generic-editing-error.ts'
import { JourneysAlreadyExistsError } from '../_erros/journeys-already-exists-error.ts'
import { PlantNotSelectedError } from '../_erros/plant-not-selected-error.ts'
import type { JourneysRepository } from '../repositories/journeys-repository.ts'
import { createSlug } from '../utils/create-slug.ts'

interface EditJourneysUseCaseRequest {
  id: string
  plantId?: string
  title?: string
  description?: string
  thumbnail_url?: string
  level?: 'Beginner' | 'Intermediate' | 'Advanced'
  visible?: boolean
}

export class EditJourneysUseCase {
  private journeysRepository: JourneysRepository
  constructor(journeysRepository: JourneysRepository) {
    this.journeysRepository = journeysRepository
  }
  async execute({
    id,
    title,
    description,
    level,
    plantId,
    thumbnail_url,
    visible,
  }: EditJourneysUseCaseRequest) {
    if (!plantId) {
      throw new PlantNotSelectedError()
    }

    let slug: string | undefined

    if (title) {
      slug = createSlug(title)

      const existingJourney = await this.journeysRepository.findBySlugAndPlant(
        slug,
        plantId,
      )

      if (existingJourney) {
        throw new JourneysAlreadyExistsError()
      }
    }

    const journey = await this.journeysRepository.edit({
      id,
      title,
      slug,
      description,
      level,
      thumbnail_url,
      plantId,
      visible,
    })

    if (!journey) {
      throw new GenericEditingError(
        'Jornada não encontrada ou não pôde ser atualizada.',
      )
    }

    return {
      journey,
    }
  }
}
