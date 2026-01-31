// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const key = event.context.params?.id

  /**
   * @type {import('../../../../../src/types/typedef').Item[]}
   */
  const items = await readJSON('items')
  const updatedItems = items.filter(item => item.key !== key)

  const resp = await writeJSON('items', updatedItems)
  return resp
})