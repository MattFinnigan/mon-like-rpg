// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').Trainer[]} */
  const itemsList = await readJSON('trainers')
  return Object.keys(itemsList).map(key => itemsList[parseInt(key)])
})