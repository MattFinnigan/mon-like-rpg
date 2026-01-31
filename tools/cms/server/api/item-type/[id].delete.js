// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const key = event.context.params?.id

  /**
   * @type {import('../../../../../src/types/typedef').ItemType[]}
   */
  const items = await readJSON('item-types')
  const updatedItems = items.filter(item => item.key !== key)

  const resp = await writeJSON('item-types', updatedItems)
  return resp
})