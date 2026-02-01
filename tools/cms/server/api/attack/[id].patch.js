// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Attack} */
  const {
    id,
    animationName,
    typeKey,
    power,
    criticalHitModifier,
    usesMonSplStat,
    powerPoints,
    accuracy
  } = body

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'ID required',
    })
  }

  if (!animationName) {
    throw createError({
      status: 400,
      statusText: 'animationName required',
    })
  }

  if (!typeKey) {
    throw createError({
      status: 400,
      statusText: 'typeKey required',
    })
  }

  if (!power) {
    throw createError({
      status: 400,
      statusText: 'power required',
    })
  }

  if (!criticalHitModifier) {
    throw createError({
      status: 400,
      statusText: 'criticalHitModifier required',
    })
  }

  if (!powerPoints) {
    throw createError({
      status: 400,
      statusText: 'powerPoints required',
    })
  }

  if (!accuracy) {
    throw createError({
      status: 400,
      statusText: 'accuracy required',
    })
  }

  /**
   * @type {import('../../../../../src/types/typedef').Attack[]}
   */
  const attacks = await readJSON('attacks')
  const attackFound = attacks.find(attack => attack.id === id)

  if (!attackFound) {
    throw createError({
      status: 404,
      statusMessage: `Attack with ID ${id} not found`
    })
  }

  const updatedItems = attacks.map(attack => {
    if (attack.id === id) {
      attack = {
        ...attack,
        ...body
      }
    }
    return attack
  })

  const resp = await writeJSON('attacks', updatedItems)
  return resp
})