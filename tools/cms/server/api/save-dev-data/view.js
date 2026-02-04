// @ts-check


export default defineEventHandler(async event => {

  /** @type {Record<string, import('../../../../../src/types/typedef.js').GlobalState>} */
  const state = await readJSON('save_data')
  return state.DEV
})