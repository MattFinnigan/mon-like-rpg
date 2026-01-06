import { DATA_ASSET_KEYS } from "../assets/asset-keys.js"
import { MON_TYPES } from "../common/mon-types.js"
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
    console.log(index)
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
   * @returns {import("../types/typedef.js").Player}
   */
  static getPlayerDetails (scene) {
    const player = scene.cache.json.get(DATA_ASSET_KEYS.PLAYER)
    const partyMons = player.partyMons.map(monId => this.getMonDetails(scene, monId))
    return { ...player, partyMons }
  }

}
