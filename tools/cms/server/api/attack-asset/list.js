// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  /** @type {import('../../../../../src/types/typedef').AttackAsset[]} Item */
  const itemsList = await readJSON('attack_assets')
  return itemsList
})