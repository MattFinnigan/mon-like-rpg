// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { assetKey, attackKey, frameWidth, frameHeight } = await readBody(event)

  if (!assetKey) {
    throw createError({
      status: 400,
      statusText: 'assetKey required',
    })
  }

  if (!attackKey) {
    throw createError({
      status: 400,
      statusText: 'attackKey required',
    })
  }

  if (!frameWidth) {
    throw createError({
      status: 400,
      statusText: 'frameWidth required',
    })
  }

  if (!frameHeight) {
    throw createError({
      status: 400,
      statusText: 'frameHeight required',
    })
  }

  const items = await readJSON('attack_assets')
  const id = items[items.length - 1].id + 1

  items.push({ ...body, id})
  const resp = await writeJSON('attack_assets', items)

  return resp
})