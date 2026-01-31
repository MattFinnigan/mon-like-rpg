// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

/**
 * @returns {Promise<import('../../../../../src/types/typedef').Mon>}
 */
export default defineEventHandler(async event => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'id required',
    })
  }
  const items = await readJSON('mons')
  /**
   * @type {import('../../../../../src/types/typedef').Mon[]}
   */
  const array = Object.keys(items).map(key => items[key])
  const item = array.find(item => item.id === parseInt(id))

  if (!item) {
    throw createError({
      status: 404,
      statusMessage: `Mon with id ${id} not found`
    })
  }

  return item
})