// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

/**
 * @returns {Promise<import('../../../../../src/types/typedef').AttackAsset>}
 */
export default defineEventHandler(async event => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'ID required',
    })
  }
  /**
   * @type {import('../../../../../src/types/typedef').AttackAsset[]}
   */
  const items = await readJSON('attack_assets')
  const item = items.find(item => item.id === parseInt(id))

  if (!item) {
    throw createError({
      status: 404,
      statusMessage: `Attack asset with ID ${id} not found`
    })
  }

  return item
})