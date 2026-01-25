import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"

export class IceShard extends Attack {
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObjectContainer

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef").Coordinate} position 
   */
  constructor (scene, position) {
    super(scene, position)

    this._attackGameObjectContainer = this._scene.add.sprite(this._position.x, this._position.y, ATTACK_ASSET_KEYS.ICE_SHARD, 2)
      .setOrigin(0.5)
      .setScale(4)
      .setAlpha(0)

    super.createAttackAnimation(ATTACK_ASSET_KEYS.ICE_SHARD_START)
    super.createAttackAnimation(ATTACK_ASSET_KEYS.ICE_SHARD)
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
    this._attackGameObjectContainer.play(ATTACK_ASSET_KEYS.ICE_SHARD_START)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_ASSET_KEYS.ICE_SHARD, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise (resolve => {
        this._attackGameObjectContainer.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD_START, () => {
          this._attackGameObjectContainer.play(ATTACK_ASSET_KEYS.ICE_SHARD)
          this._attackGameObjectContainer.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD, () => {
            this._isAnimationPlaying = false
            resolve()
          })
        })
      })
    ]

    Promise.all(promises).then(() => {
      this._attackGameObjectContainer.setAlpha(0).setFrame(0)
      if (callback) {
        callback()
      }
    })
  }  
}