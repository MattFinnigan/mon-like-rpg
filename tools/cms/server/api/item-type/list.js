// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').ItemType[]} */
  const itemsList = await readJSON('item-types')
  return itemsList
})