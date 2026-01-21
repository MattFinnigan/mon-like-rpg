import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"

export class Splash extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObject
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject2
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject3

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef.js").Coordinate} position 
   */
  constructor (scene, position) {
    super(scene, position)
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation (callback) {
    if (this._isAnimationPlaying) {
      return
    }
    callback()
  }  
}