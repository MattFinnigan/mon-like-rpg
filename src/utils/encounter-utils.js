import { getMonStats } from "./battle-utils.js"
import { DataUtils } from "./data-utils.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef.js").EncounterAreaConfig} area
 * @returns {{
 *  mon: import("../types/typedef.js").Mon,
 *  baseMon: import("../types/typedef.js").BaseMon
 * }}
 */
export function generateWildMon (scene, area) {
  const chosenMon = chooseEncounterMon(area.mons)

  const level = Phaser.Math.Between(chosenMon.minLevel, chosenMon.maxLevel)
  const baseMon = DataUtils.getBaseMonDetails(scene, chosenMon.baseMonIndex)

  /** @type {import("../types/typedef.js").Mon} */
  const mon = {
    id: undefined,
    baseMonIndex: chosenMon.baseMonIndex,
    currentLevel: level,
    currentHp: 123,
    attackIds: [1, 2],
    attackEV: Phaser.Math.Between(0, 30),
    defenseEV: Phaser.Math.Between(0, 30),
    splAttackEV: Phaser.Math.Between(0, 30),
    splDefenseEV: Phaser.Math.Between(0, 30),
    speedEV: Phaser.Math.Between(0, 30),
    hpEV: Phaser.Math.Between(0, 30),
    name: baseMon.name
  }
  
  const monHp = getMonStats(baseMon, mon).hp
  mon.currentHp = monHp

  return { mon, baseMon }
}

/**
 * @param {import("../types/typedef.js").EncounterMon[]} mons
 * @returns {import("../types/typedef.js").EncounterMon}
 */
export function chooseEncounterMon (mons) {
  const totalWeight = mons.reduce((sum, m) => sum + m.rate, 0)
  let roll = Math.random() * totalWeight

  for (const mon of mons) {
    roll -= mon.rate
    if (roll <= 0) return mon
  }

  return mons[mons.length - 1]
}