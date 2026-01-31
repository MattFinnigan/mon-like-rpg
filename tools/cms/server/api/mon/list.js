// @ts-check
import { readJSON } from '../../utils/jsonStore.js'

export default defineEventHandler(async event => {

  const data = await readJSON('mons')
  return data
})