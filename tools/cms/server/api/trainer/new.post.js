// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Trainer} */
  const {
    name,
    trainerType,
    rewardOnVictory,
    payOutOnDefeat,
    assetKey,
    partyMons,
    defeatedMsg
  } = body

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
  if (!array) {
    return
  }

  const lastObj = array[array?.length - 1]
  let id = 1

  if (lastObj && lastObj.id) {
    id = array.length && lastObj?.id + 1
  }

  array.push({ ...body, id})

  const updatedObj = Object.fromEntries(
    array.map(item => [item.id, item])
  )
  const resp = await writeJSON('trainers', updatedObj)

  return resp
})