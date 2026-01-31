// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const id = event.context.params?.id

  if (!id) {
    return
  }

  /**
   * @type {import('../../../../../src/types/typedef').Attack[]}
   */
  const attacks = await readJSON('attacks')
  const updatedItems = attacks.filter(attack => attack.id !== parseInt(id))

  const resp = await writeJSON('attacks', updatedItems)
  return resp
})