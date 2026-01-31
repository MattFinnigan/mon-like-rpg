// @ts-check
/**
 * @returns {Promise<import('../../../../../src/types/typedef').Attack>}
 */
export default defineEventHandler(async event => {
  /** @type {import('../../../../../src/types/typedef').Attack} */
  const res = {
    id: 0,
    animationName: 'BARRIER',
    name: '',
    statusEffect: null,
    criticalHitModifier: 1,
    typeKey: 'NORMAL',
    power: 100,
    usesMonSplStat: false,
    powerPoints: 10,
    accuracy: 100,
    turnsInEffect: 0,
    turnsOnCooldown: 0,
    turnsToCharge: 0,
    selfBattleStatEffects: [],
    opponentBattleStatEffects: []
  }
  return res
})