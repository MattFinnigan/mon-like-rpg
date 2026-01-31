// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const { id, assetKey, attackKey, frameWidth, frameHeight } = await readBody(event)

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'id required',
    })
  }

  if (!assetKey) {
    throw createError({
      status: 400,
      statusText: 'assetKey required',
    })
  }

  if (!attackKey) {
    throw createError({
      status: 400,
      statusText: 'attackKey required',
    })
  }

  if (!frameWidth) {
    throw createError({
      status: 400,
      statusText: 'frameWidth required',
    })
  }

  if (!frameHeight) {
    throw createError({
      status: 400,
      statusText: 'frameHeight required',
    })
  }

  /**
   * @type {import('../../../../../src/types/typedef').AttackAsset[]}
   */
  const items = await readJSON('attack_assets')
  const itemFound = items.find(item => item.id === id)

  if (!itemFound) {
    throw createError({
      status: 404,
      statusMessage: `Attack asset with id ${id} not found`
    })
  }

  const updatedItems = items.map(item => {
    if (item.id === id) {
      item = {
        ...item,
        assetKey,
        attackKey,
        frameHeight,
        frameWidth
      }
    }
    return item
  })

  const resp = await writeJSON('attack_assets', updatedItems)
  return resp
})