// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const id = event.context.params?.id
  if (!id) {
    return
  }
  const items = await readJSON('trainers')
  /**
   * @type {import('../../../../../src/types/typedef').Trainer[]}
   */
  const array = Object.keys(items).map(key => items[key])
  const updatedItems = array.filter(item => item.id !== parseInt(id))

  const updatedObj = Object.fromEntries(
    updatedItems.map(item => [item.id, item])
  )

  const resp = await writeJSON('trainers', updatedObj)
  return resp
})