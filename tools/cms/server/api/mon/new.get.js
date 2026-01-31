// @ts-check
/**
 * @returns {Promise<import('../../../../../src/types/typedef').Mon>}
 */
export default defineEventHandler(async event => {
  /** @type {import('../../../../../src/types/typedef').Mon} */
  const res = {
    id: 0,
    baseMonIndex: 0,
    name: '',
    currentHp: null,
    currentLevel: 1,
    attackEV: 1,
    defenseEV: 1,
    splAttackEV: 1,
    splDefenseEV: 1,
    speedEV: 1,
    hpEV: 1,
    attackIds: [0],
    currentExp: 0
  }
  return res
})