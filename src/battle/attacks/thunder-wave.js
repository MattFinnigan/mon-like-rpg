import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "./attack-keys.js"

export class ThunderWave extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObjectContainer
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef.js").Coordinate} position 
   */
  constructor (scene, position) {
    super(scene, position)

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.ELECTRIC, 0)
      .setOrigin(0.5, 0.3).setScale(1.5)

    this._attackGameObjectContainer = this._scene.add.container(this._position.x, this._position.y, [
      this._attackGameObject1
    ]).setAlpha(0)

    super.createAttackAnimation(ATTACK_KEYS.THUNDER_WAVE)     
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
    this._attackGameObjectContainer.setAlpha(1)
    this._attackGameObject1.play(ATTACK_KEYS.THUNDER_WAVE)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_KEYS.THUNDER_WAVE, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {

        this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_KEYS.THUNDER_WAVE, () => {
          this._isAnimationPlaying = false
          this._attackGameObjectContainer.setAlpha(0)
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