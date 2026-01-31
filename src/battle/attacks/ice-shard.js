import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../generated/attack-asset-keys.js"
import { Attack } from "./attack.js"

export class IceShard extends Attack {
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObjectContainer

  /**
   * 
   * @param {Phaser.Scene} scene
   */
  constructor (scene) {
    super(scene)

    this._attackGameObjectContainer = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.ICE_SHARD, 2)
      .setOrigin(0.5)
      .setScale(4)
      .setAlpha(0)
  
    this.#createAnimation()
  }

  #createAnimation () {
    const start = {
      key: ATTACK_ASSET_KEYS.ICE_SHARD_START,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.ICE_SHARD_START),
      frameRate: 9,
      repeat: 0,
      delay: 0,
      yoyo: false,
      assetKey: ATTACK_ASSET_KEYS.ICE_SHARD_START
    }

    const anim = {
      key: ATTACK_ASSET_KEYS.ICE_SHARD,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.ICE_SHARD),
      frameRate: 9,
      repeat: 0,
      delay: 0,
      yoyo: false
    }

    this._scene.anims.create(start)
    this._scene.anims.create(anim)
  }

  /**
   * @param {() => void} callback
   * @param {Phaser.GameObjects.Image} attacker
   * @param {Phaser.GameObjects.Image} defender
   * @returns {void}
   */
  playAnimation (attacker, defender, callback) {
    if (this._isAnimationPlaying) {
      return
    }
    
    this._isAnimationPlaying = true
    this._attackGameObjectContainer.setPosition(defender.x, defender.y)
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