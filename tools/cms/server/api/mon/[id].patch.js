// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Mon} */
  const {
    id,
    baseMonIndex,
    name,
    currentLevel,
    attackEV,
    defenseEV,
    splAttackEV,
    splDefenseEV,
    speedEV,
    hpEV,
    attackIds,
    currentExp
  } = body

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'id required',
    })
  }

  if (!baseMonIndex) {
    throw createError({
      status: 400,
      statusText: 'baseMonIndex required',
    })
  }

  if (!name) {
    throw createError({
      status: 400,
      statusText: 'NAME required',
    })
  }

  if (!currentLevel) {
    throw createError({
      status: 400,
      statusText: 'currentLevel required',
    })
  }

  if (!attackEV) {
    throw createError({
      status: 400,
      statusText: 'attackEV required',
    })
  }

  if (!defenseEV) {
    throw createError({
      status: 400,
      statusText: 'defenseEV required',
    })
  }

  if (!splAttackEV) {
    throw createError({
      status: 400,
      statusText: 'splAttackEV required',
    })
  }

  if (!splDefenseEV) {
    throw createError({
      status: 400,
      statusText: 'splDefenseEV required',
    })
  }

  if (!speedEV) {
    throw createError({
      status: 400,
      statusText: 'speedEV required',
    })
  }

  if (!hpEV) {
    throw createError({
      status: 400,
      statusText: 'hpEV required',
    })
  }

  if (!attackIds) {
    throw createError({
      status: 400,
      statusText: 'attackIds required',
    })
  }

  if (!currentExp) {
    throw createError({
      status: 400,
      statusText: 'currentExp required',
    })
  }

  const items = await readJSON('mons')
  /**
   * @type {import('../../../../../src/types/typedef').Mon[]}
   */
  const array = Object.keys(items).map(key => items[key])
  const itemFound = array.find(item => item.id === id)

  if (!itemFound) {
    throw createError({
      status: 404,
      statusMessage: `Mon with ID ${id} not found`
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

  const resp = await writeJSON('mons', updatedObj)
  return resp
})