// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  return
  const { key, name, typeKey, value } = await readBody(event)

  if (!key) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }

  if (!name) {
    throw createError({
      status: 400,
      statusText: 'NAME required',
    })
  }

  if (!typeKey) {
    throw createError({
      status: 400,
      statusText: 'TYPEKEY required',
    })
  }

  if (!value) {
    throw createError({
      status: 400,
      statusText: 'VALUE required',
    })
  }

  /**
   * @type {import('../../../../../src/types/typedef').Item[]}
   */
  const attacks = await readJSON('attacks')
  const attackFound = attacks.find(attack => attack.key === key)

  if (!attackFound) {
    throw createError({
      status: 404,
      statusMessage: `Item with key ${key} not found`
    })
  }

  const updatedItems = attacks.map(attack => {
    if (attack.key === key) {
      attack = {
        ...attack,
        name,
        typeKey,
        value
      }
    }
    return attack
  })

  const resp = await writeJSON('attacks', updatedItems)
  return resp
})