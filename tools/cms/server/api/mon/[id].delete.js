// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const id = event.context.params?.id
  if (!id) {
    return
  }

  /** @type {import('../../../../../src/types/typedef').Trainer[]} */
  const trainers = await readJSON('trainers')
  
  const isAssignedToTrainer = Object.keys(trainers).filter(key => {
    // @ts-ignore // partyMons is number[] but eventually becomes Mon[]...
    return trainers[key].partyMons.includes(parseInt(id))
  })[0]

  if (isAssignedToTrainer) {
    throw createError({
      status: 400,
      statusText: 'Cannot delete - is assigned to trainer #' + isAssignedToTrainer,
    })
  }

  const items = await readJSON('mons')
  /**
   * @type {import('../../../../../src/types/typedef').Mon[]}
   */
  const array = Object.keys(items).map(key => items[key])
  const updatedItems = array.filter(item => item.id !== parseInt(id))

  const updatedObj = Object.fromEntries(
    updatedItems.map(item => [item.id, item])
  )

  const resp = await writeJSON('mons', updatedObj)
  return resp
})