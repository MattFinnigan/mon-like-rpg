// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').Attack[]} */
  const attacksList = await readJSON('attacks')
  return attacksList
})