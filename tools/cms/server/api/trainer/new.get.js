// @ts-check
/**
 * @returns {Promise<import('../../../../../src/types/typedef').MTraineron>}
 */
export default defineEventHandler(async event => {
  /** @type {import('../../../../../src/types/typedef').Trainer} */
  const res = {
    id: 0,
    name: '',
    trainerType: '',
    rewardOnVictory: 0,
    payOutOnDefeat: 0,
    assetKey: 'PSYCHIC',
    partyMons: [],
    defeatedMsg: ''
  }
  return res
})