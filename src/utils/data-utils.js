import { DATA_ASSET_KEYS } from "../assets/asset-keys.js"
import { MON_TYPES } from "../common/mon-types.js"

export class DataUtils {
  static getMonAttack (scene, attackId) {
    /** @type {import("../types/typedef.js").Attack[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS)
    return data.find(attk => attk.id === attackId)
  }

  static getAnimations (scene) {
    /** @type {import("../types/typedef.js").Animation[]} */
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS)
    return data
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} id 
   * @returns {import("../types/typedef.js").Mon}
   */

  static getMonDetails (scene, id) {
    /** @type {import("../types/typedef.js").Mon} */
    return { id, ...scene.cache.json.get(DATA_ASSET_KEYS.MONS)[id] }
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} index 
   * @returns {import("../types/typedef.js").BaseMon}
   */
  static getBaseMonDetails (scene, index) {
    const data = scene.cache.json.get(DATA_ASSET_KEYS.BASE_MONS)[index]
    const types = data.types.map(type => MON_TYPES[type])
    return { ...data, types }
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} id 
   * @returns {import("../types/typedef.js").EncounterAreaConfig}
   */
  static getEncoutnerConfig (scene, id) {
    return scene.cache.json.get(DATA_ASSET_KEYS.ENCOUNTER_AREAS)[id]
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../types/typedef.js").EncounterAreaConfig} area
   * @returns {{
   *  mon: import("../types/typedef.js").Mon,
   *  baseMon: import("../types/typedef.js").BaseMon
   * }}
   */
  static generateWildMon (scene, area) {
    const chosenMon = this.chooseEncounterMon(area.mons)
  
    const level = Phaser.Math.Between(chosenMon.minLevel, chosenMon.maxLevel)
    
    /** @type {import("../types/typedef.js").Mon} */
    const mon = {
      baseMonIndex: chosenMon.baseMonIndex,
      currentLevel: level,
      currentHp: 100,
      attackIds: [1, 2],
      attackEV: Phaser.Math.Between(0, 30),
      defenseEV: Phaser.Math.Between(0, 30),
      splAttackEV: Phaser.Math.Between(0, 30),
      splDefenseEV: Phaser.Math.Between(0, 30),
      speedEV: Phaser.Math.Between(0, 30),
      hpEV: Phaser.Math.Between(0, 30),
    }
    const baseMon = this.getBaseMonDetails(scene, chosenMon.baseMonIndex)

    return { mon, baseMon }
  }

  /**
   * @param {import("../types/typedef.js").EncounterMon[]} mons
   * @returns {import("../types/typedef.js").EncounterMon}
   */
  static chooseEncounterMon (mons) {
    const totalWeight = mons.reduce((sum, m) => sum + m.rate, 0)
    let roll = Math.random() * totalWeight

    for (const mon of mons) {
      roll -= mon.rate
      if (roll <= 0) return mon
    }

    return mons[mons.length - 1]
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} id 
   * @returns {import("../types/typedef.js").Trainer}
   */
  static getTrainerDetails (scene, id) {
    const trainer = scene.cache.json.get(DATA_ASSET_KEYS.TRAINERS)[id]
    const mons = trainer.mons.map(monId => this.getMonDetails(scene, monId))
    return { ...trainer, mons }
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @returns {import("../types/typedef.js").Player}
   */
  static getPlayerDetails (scene) {
    const player = scene.cache.json.get(DATA_ASSET_KEYS.PLAYER)
    const partyMons = player.partyMons.map(monId => this.getMonDetails(scene, monId))
    return { ...player, partyMons }
  }

}
