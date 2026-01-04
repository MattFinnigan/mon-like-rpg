/**
 * 
 * @param {import("../types/typedef").BaseMon} baseMon 
 * @param {import("../types/typedef").Mon} mon
 * @param {object} [modifiers]
 * @returns {import("../types/typedef").MonStats}
 */
export function getMonStats (baseMon, mon, modifiers) {
  return {
    attack: Math.floor(((baseMon.baseAttack + mon.attackEV) * 2) * mon.currentLevel / 300) + 5,
    defense: Math.floor(((baseMon.baseDefense + mon.defenseEV) * 2) * mon.currentLevel / 300) + 5,
    splAttack: Math.floor(((baseMon.baseSplAttack + mon.splAttackEV) * 2) * mon.currentLevel / 300) + 5,
    splDefense: Math.floor(((baseMon.baseSplDefense + mon.splDefenseEV) * 2) * mon.currentLevel / 300) + 5,
    speed: Math.floor(((baseMon.baseSpeed + mon.speedEV) * 2) * mon.currentLevel / 300) + 5,
    hp: Math.floor(((baseMon.baseHp + mon.hpEV) * 2) * mon.currentLevel / 300) + mon.currentLevel + 10
  }
}