// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

/**
 * @returns {Promise<import('../../../../../src/types/typedef').Item>}
 */
export default defineEventHandler(async event => {
  const key = event.context.params?.id

  if (!key) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }
  /**
   * @type {import('../../../../../src/types/typedef').Item[]}
   */
  const items = await readJSON('items')
  const item = items.find(item => item.key === key)

  if (!item) {
    throw createError({
      status: 404,
      statusMessage: `Item with key ${key} not found`
    })
  }

  return item
})