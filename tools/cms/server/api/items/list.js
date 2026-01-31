// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').Item[]} Item */
  const itemsList = await readJSON('items')
  return itemsList
})