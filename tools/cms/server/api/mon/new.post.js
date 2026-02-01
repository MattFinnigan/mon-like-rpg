// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Mon} */
  const {
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

  if (currentExp === undefined) {
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
  if (!array) {
    return
  }

  const lastObj = array[array?.length - 1]
  let id = 1

  if (lastObj && lastObj.id) {
    id = array.length && lastObj?.id + 1
  }

  const newMon = { ...body, id}

  array.push(newMon)

  const updatedObj = Object.fromEntries(
    array.map(item => [item.id, item])
  )
  const resp = await writeJSON('mons', updatedObj)

  return newMon
})