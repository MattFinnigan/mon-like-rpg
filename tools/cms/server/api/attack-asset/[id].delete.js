// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const id = event.context.params?.id

  if (!id) {
    return
  }

  /**
   * @type {import('../../../../../src/types/typedef').AttackAsset[]}
   */
  const items = await readJSON('attack_assets')
  const updatedItems = items.filter(item => item.id !== parseInt(id))

  const resp = await writeJSON('attack_assets', updatedItems)
  return resp
})