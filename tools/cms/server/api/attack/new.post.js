// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  return
  const body = await readBody(event)
  const { key, name, typeKey, value } = body

  if (!key) {
    throw createError({
      status: 400,
      statusText: 'KEY required',
    })
  }

  if (!name) {
    throw createError({
      status: 400,
      statusText: 'NAME required',
    })
  }

  if (!typeKey) {
    throw createError({
      status: 400,
      statusText: 'TYPEKEY required',
    })
  }

  if (!value) {
    throw createError({
      status: 400,
      statusText: 'VALUE required',
    })
  }

  const items = await readJSON('items')
  items.push(body)
  const resp = await writeJSON('items', items)

  return resp
})