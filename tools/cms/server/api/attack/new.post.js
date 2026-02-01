// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  /** @type {import('../../../../../src/types/typedef').Attack} */
  const {
    animationName,
    typeKey,
    power,
    criticalHitModifier,
    usesMonSplStat,
    powerPoints,
    accuracy
  } = body


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

  const items = await readJSON('attacks')
  const id = items[items.length - 1].id + 1

  items.push({ ...body, id})
  const resp = await writeJSON('attacks', items)

  return resp
})