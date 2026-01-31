// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').BaseMon[]} */
  const itemsList = await readJSON('base-mons')
  return Object.keys(itemsList).map(key => itemsList[parseInt(key)])
})