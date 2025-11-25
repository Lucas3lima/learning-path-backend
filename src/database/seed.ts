import { hash } from 'bcryptjs'
import { db } from './client.ts'
import { countries, plants, sectors, userPlants, users } from './schema.ts'

async function seed() {
  const country = await db
    .insert(countries)
    .values({
      name: 'Brasil',
      slug: 'brasil',
    })
    .returning()

  const clg = await db
    .insert(plants)
    .values({
      name: 'Campo Largo',
      slug: 'clg',
      country_id: country[0].id,
    })
    .returning()

  await db.insert(sectors).values([
    { name: 'Tec. & Inovação', slug: 'tech_inov', plantId: clg[0].id },
    { name: 'Produção', slug: 'prod', plantId: clg[0].id },
  ])

  const user1 = await db
    .insert(users)
    .values({
      name: 'Lucas Lima',
      email: 'lucas.lima@metalsa.com',
      password_hash: await hash('2469', 6),
      registration_number: '2469',
      role: 'manager',
    })
    .returning()

  const user2 = await db
    .insert(users)
    .values({
      name: 'Tamara Valomin',
      email: 'tamara.valomin@metalsa.com',
      password_hash: await hash('1234', 6),
      registration_number: '1234',
      role: 'user',
    })
    .returning()

  await db.insert(userPlants).values([
    { userId: user1[0].id, plantId: clg[0].id, role: 'manager' },
    { userId: user2[0].id, plantId: clg[0].id, role: 'student' },
  ])
}

seed()
