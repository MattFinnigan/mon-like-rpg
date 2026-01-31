// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').BaseMon} */
  const data = await readJSON('base-mons')
  return data
})