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
    let chosenMon = null
    let index = 0
    // TODO improve this - first mon in the arr is always more likely
    while (!chosenMon) {
      if (!area.mons[index]) {
        index = 0
      }
      if (Math.random() < area.mons[index].rate) {
        /** @type {import("../types/typedef.js").EncounterMon} */
        chosenMon = area.mons[index]
      }
      index++
    }

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
}