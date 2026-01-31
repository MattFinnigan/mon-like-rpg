// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
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
  const items = await readJSON('items')
  const itemFound = items.find(item => item.key === key)

  if (!itemFound) {
    throw createError({
      status: 404,
      statusMessage: `Item with key ${key} not found`
    })
  }

  const updatedItems = items.map(item => {
    if (item.key === key) {
      item = {
        ...item,
        name,
        typeKey,
        value
      }
    }
    return item
  })

  const resp = await writeJSON('items', updatedItems)
  return resp
})