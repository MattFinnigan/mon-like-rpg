// @ts-check

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { player} = body
  const { name, partyMons, inventory } = player

  if (!player) {
    throw createError({
      status: 400,
      statusText: 'player required',
    })
  }

  if (!name) {
    throw createError({
      status: 400,
      statusText: 'name required',
    })
  }

  if (!partyMons) {
    throw createError({
      status: 400,
      statusText: 'partyMons required',
    })
  }

  if (!inventory) {
    throw createError({
      status: 400,
      statusText: 'inventory required',
    })
  }

  /** @type {Record<string, import('../../../../../src/types/typedef.js').GlobalState>} */
  const currentState = await readJSON('save_data')

  const updatedState = {
    ...currentState,
    NORMAL: {
      ...currentState.NORMAL,
      ...body
    }
  }

  const resp = await writeJSON('save_data', updatedState)
  return resp
})