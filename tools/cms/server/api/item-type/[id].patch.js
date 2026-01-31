// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const { key, usableDuringScenes } = await readBody(event)

  if (!key) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }

  /**
   * @type {import('../../../../../src/types/typedef').ItemType[]}
   */
  const items = await readJSON('item-types')
  const itemFound = items.find(item => item.key === key)

  if (!itemFound) {
    throw createError({
      status: 404,
      statusMessage: `Item Type with key ${key} not found`
    })
  }

  const updatedItems = items.map(item => {
    if (item.key === key) {
      item = {
        ...item,
        usableDuringScenes
      }
    }
    return item
  })

  const resp = await writeJSON('item-types', updatedItems)
  return resp
})