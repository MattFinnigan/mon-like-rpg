import Phaser from "../../lib/phaser.js"
import { AudioManager } from "../../utils/audio-manager.js"
import { DataUtils } from "../../utils/data-utils.js"

export class Attack {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected @type {import("../../types/typedef").Coordinate} */
  _position
  /** @protected @type {boolean} */
  _isAnimationPlaying
  /** @protected @type {Phaser.GameObjects.Sprite|Phaser.GameObjects.Container|undefined} */
  _attackGameObjectContainer
  /** @protected @type {AudioManager} */
  _audioManager

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef").Coordinate} position 
   */
  constructor (scene, position) {
    this._scene = scene
    this._position = position
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

  /**
   * @param {() => void} callback
   * @returns {void}
   */
  playAnimation (callback) {
    throw new Error('playAnimation is not implemented')
  }

  /**
   * @param {string} assetKey 
   */
  createAttackAnimation (assetKey) {
    if (!this._scene.anims.get(assetKey)) {
      const animation = DataUtils.getAttackAnimation(this._scene, assetKey)
      if (!animation) {
        return
      }
      const frames = animation.frames
        ? this._scene.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
        : this._scene.anims.generateFrameNumbers(animation.assetKey)

      const anim = {
        key: animation.key,
        frames: frames,
        frameRate: animation.frameRate,
        repeat: animation.repeat,
        delay: animation.delay,
        yoyo: animation.yoyo
      }

      this._scene.anims.create(anim)
    }
  }
}