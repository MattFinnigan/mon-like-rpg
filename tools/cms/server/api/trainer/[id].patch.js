// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Trainer} */
  const {
    id,
    name,
    trainerType,
    rewardOnVictory,
    payOutOnDefeat,
    assetKey,
    partyMons,
    defeatedMsg
  } = body

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'id required',
    })
  }

  if (!name) {
    throw createError({
      status: 400,
      statusText: 'name required',
    })
  }

  if (!trainerType) {
    throw createError({
      status: 400,
      statusText: 'trainerType required',
    })
  }

  if (!rewardOnVictory) {
    throw createError({
      status: 400,
      statusText: 'rewardOnVictory required',
    })
  }

  if (!payOutOnDefeat) {
    throw createError({
      status: 400,
      statusText: 'payOutOnDefeat required',
    })
  }

  if (!assetKey) {
    throw createError({
      status: 400,
      statusText: 'assetKey required',
    })
  }

  if (!partyMons) {
    throw createError({
      status: 400,
      statusText: 'partyMons required',
    })
  }

  if (!defeatedMsg) {
    throw createError({
      status: 400,
      statusText: 'defeatedMsg required',
    })
  }

  const items = await readJSON('trainers')
  /**
   * @type {import('../../../../../src/types/typedef').Trainer[]}
   */
  const array = Object.keys(items).map(key => items[key])
  const itemFound = array.find(item => item.id === id)

  if (!itemFound) {
    throw createError({
      status: 404,
      statusMessage: `Trainer with ID ${id} not found`
    })
  }

  const updatedItems = array.map(item => {
    if (item.id === id) {
      item = {
        ...item,
        ...body
      }
    }
    return item
  })

  const updatedObj = Object.fromEntries(
    updatedItems.map(item => [item.id, item])
  )

  const resp = await writeJSON('trainers', updatedObj)
  return resp
})