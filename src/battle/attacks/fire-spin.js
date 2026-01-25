import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"

export class FireSpin extends Attack {
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

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.FIRE_SPIN, 0)
      .setOrigin(0.5).setScale(1.25)

    this._attackGameObject = this._scene.add.container(this._position.x, this._position.y, [
      this._attackGameObject1
    ]).setAlpha(0)
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation (callback) {
    if (this._isAnimationPlaying) {
      return
    }

    this._isAnimationPlaying = true
    this._attackGameObject.setAlpha(1)
    this._attackGameObject1.play(ATTACK_ASSET_KEYS.FIRE_SPIN)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_ASSET_KEYS.FIRE_SPIN, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.FIRE_SPIN, () => {
          this._isAnimationPlaying = false
          this._attackGameObject.setAlpha(0)
          this._attackGameObject1.setFrame(0)
          resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      if (callback) {
        callback()
      }
    })
  }  
}