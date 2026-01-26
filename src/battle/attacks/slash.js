import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_ANIMS_PATH } from "../../utils/consts.js"

export class Slash extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObjectContainer
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject2
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject3

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef").Coordinate} position 
   */
  constructor (scene, position) {
    super(scene, position)

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
      .setScale(4)

    this._attackGameObject2 = this._scene.add.sprite(30, 0, ATTACK_ASSET_KEYS.SLASH, 1)
      .setScale(4)
  
    this._attackGameObject3 = this._scene.add.sprite(-30, 0, ATTACK_ASSET_KEYS.SLASH, 2)
      .setScale(4)

    this._attackGameObjectContainer = this._scene.add.container(this._position.x, this._position.y, [
      this._attackGameObject1,
      this._attackGameObject2,
      this._attackGameObject3
    ]).setAlpha(0)

    super.createAttackAnimation(ATTACK_ASSET_KEYS.SLASH)
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
    this._attackGameObject1.play(ATTACK_ASSET_KEYS.SLASH)
    this._attackGameObject2.play(ATTACK_ASSET_KEYS.SLASH)
    this._attackGameObject3.play(ATTACK_ASSET_KEYS.SLASH)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_ASSET_KEYS.SLASH, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SLASH, () => {
          this._isAnimationPlaying = false
          this._attackGameObjectContainer.setAlpha(0)
          this._attackGameObject1.setFrame(0)
          this._attackGameObject2.setFrame(1)
          this._attackGameObject3.setFrame(2)
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