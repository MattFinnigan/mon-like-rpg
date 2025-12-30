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
}