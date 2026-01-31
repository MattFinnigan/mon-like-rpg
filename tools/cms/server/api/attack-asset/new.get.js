// @ts-check
/**
 * @returns {Promise<import('../../../../../src/types/typedef').AttackAsset>}
 */
export default defineEventHandler(async event => {
  /** @type {import('../../../../../src/types/typedef').AttackAsset} */
  const res = {
    id: 0,
    assetKey: 'ELECTRIC',
    attackKey: 'BARRIER',
    frameWidth: 0,
    frameHeight: 0
  }
  return res
})