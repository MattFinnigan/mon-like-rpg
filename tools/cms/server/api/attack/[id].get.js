// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

/**
 * @returns {Promise<import('../../../../../src/types/typedef').Attack>}
 */
export default defineEventHandler(async event => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }
  /**
   * @type {import('../../../../../src/types/typedef').Attack[]}
   */
  const attacks = await readJSON('attacks')
  const attack = attacks.find(attack => attack.id === parseInt(id))

  if (!attack) {
    throw createError({
      status: 404,
      statusMessage: `Attack with id ${id} not found`
    })
  }

  return attack
})