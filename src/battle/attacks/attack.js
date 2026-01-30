import Phaser from "../../lib/phaser.js"
import { AudioManager } from "../../utils/audio-manager.js"

export class Attack {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected @type {boolean} */
  _isAnimationPlaying
  /** @protected @type {Phaser.GameObjects.Sprite|Phaser.GameObjects.Container|undefined} */
  _attackGameObjectContainer
  /** @protected @type {AudioManager} */
  _audioManager
  /** @type {'PLAYER' | 'ENEMY'} */
  #target

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this._scene = scene
    this._isAnimationPlaying = false
    this._attackGameObject = undefined
    this._audioManager = this._scene.registry.get('audio')
  }

  /**
   * @returns {Phaser.GameObjects.Sprite|Phaser.GameObjects.Container|undefined}
  */
  get gameObjectContainer () {
    return this._attackGameObjectContainer
  }

  /** @returns {'PLAYER' | 'ENEMY'} */
  get target () {
    return this.#target
  }

  /** @param {'PLAYER' | 'ENEMY'} val */
  set target (val) {
    this.#target = val
  }

  /**
   * @param {() => void} callback
   * @param {Phaser.GameObjects.Image} attacker
   * @param {Phaser.GameObjects.Image} defender
   * @returns {void}
   */
  playAnimation (attacker, defender, callback) {
    throw new Error('playAnimation is not implemented')
  }

  /**
   * @param {() => void} callback
   * @param {Phaser.GameObjects.Image} attacker
   * @param {Phaser.GameObjects.Image} defender
   * @returns {void}
   */
  playChargingAnimation (attacker, defender, callback) {}
}