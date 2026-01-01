import { DATA_ASSET_KEYS } from "../assets/asset-keys.js"

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
    return scene.cache.json.get(DATA_ASSET_KEYS.MONS)[id]
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} index 
   * @returns {import("../types/typedef.js").BaseMon}
   */
  static getBaseMonDetails (scene, index) {
    return scene.cache.json.get(DATA_ASSET_KEYS.BASE_MONS)[index]
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
   * @returns {import("../types/typedef.js").Mon}
   */
  static generateWildMon (scene, area) {
    let index = 0
    
    const chosenMon = this.chooseEncounterMon(area.mons)

    // TODO generate wild mon attacks, hp, base attk etc
    // const baseDetails = this.getBaseMonDetails(scene, chosenMon.monIndex)
    const level = Phaser.Math.Between(chosenMon.minLevel, chosenMon.maxLevel)

    return {
      monIndex: chosenMon.monIndex,
      currentLevel: level,
      maxHp: 10,
      currentHp: 10,
      attackIds: [1, 2]
    }
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
}
