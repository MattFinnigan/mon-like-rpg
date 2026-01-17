import { DATA_ASSET_KEYS } from "../assets/asset-keys.js"
import { ITEM_TYPE_DATA, ITEM_TYPE_KEY } from "../types/items.js"
import { MON_TYPES } from "../types/mon-types.js"
import { getMonStats } from "./battle-utils.js"

export class DataUtils {
  static getMonAttack (scene, attackId) {
    const data = scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS)
    const attk = data.find(attk => attk.id === attackId)
    return attk
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
    const data = { id, ...scene.cache.json.get(DATA_ASSET_KEYS.MONS)[id] }
    if (data.currentHp === null) {
      data.currentHp = getMonStats(this.getBaseMonDetails(scene, data.baseMonIndex), data).hp
    }
    return data
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
   * @param {number} id 
   * @returns {import("../types/typedef.js").Trainer}
   */
  static getTrainerDetails (scene, id) {
    const trainer = scene.cache.json.get(DATA_ASSET_KEYS.TRAINERS)[id]
    const partyMons = trainer.partyMons.map(monId => this.getMonDetails(scene, monId))
    return { ...trainer, partyMons }
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @returns {import("../types/typedef.js").Item[]}
   */
  static getItemDetails (scene) {
    const items = scene.cache.json.get(DATA_ASSET_KEYS.ITEMS)
    return items.map(item => {
      item.type = ITEM_TYPE_DATA[ITEM_TYPE_KEY[item.typeKey]]
      return item
    })
  }

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {number} baseMonIndex 
   * @param {number} level
   * @param {boolean} [currentLevelOnly=false]
   * @returns {number[]}
   */
  static getMonLearnableMoves (scene, baseMonIndex, level, currentLevelOnly = false) {
    const data = scene.cache.json.get(DATA_ASSET_KEYS.LEVEL_UP_MOVES)[baseMonIndex]
    const res = []

    for (const lvlNeeded in data) {
      if (currentLevelOnly) {
        if (parseInt(lvlNeeded) === level) {
          res.push(data[lvlNeeded])
        }
        return
      }
      if (parseInt(lvlNeeded) <= level) {
        res.push(data[lvlNeeded])
      }
    }
    return [...new Set(res)]
  }

}
