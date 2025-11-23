import { expect, test } from 'vitest'
import { app } from '../../app.ts'

test('Create account test', async () => {
  await app.ready()

  const x = 1 - 1

  expect(x).toBe(2)
})
