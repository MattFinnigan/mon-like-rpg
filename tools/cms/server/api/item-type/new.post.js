// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { key } = body

  if (!key) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }


  const items = await readJSON('item-types')
  items.push(body)
  const resp = await writeJSON('item-types', items)
    
  return resp
})