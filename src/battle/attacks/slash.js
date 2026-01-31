import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../generated/attack-asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "../../generated/attack-keys.js"

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
   */
  constructor (scene) {
    super(scene)

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0)
      .setScale(4)

    this._attackGameObject2 = this._scene.add.sprite(30, 0, ATTACK_ASSET_KEYS.SLASH, 1)
      .setScale(4)
  
    this._attackGameObject3 = this._scene.add.sprite(-30, 0, ATTACK_ASSET_KEYS.SLASH, 2)
      .setScale(4)

    this._attackGameObjectContainer = this._scene.add.container(0, 0, [
      this._attackGameObject1,
      this._attackGameObject2,
      this._attackGameObject3
    ]).setAlpha(0)

    this.#createAnimation()
  }

  #createAnimation () {
    const anim = {
      key: ATTACK_KEYS.SLASH,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.SLASH),
      frameRate: 12,
      repeat: 0,
      delay: 0,
      yoyo: false
    }

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
      callback()
      return
    }

    this._isAnimationPlaying = true
    this._attackGameObjectContainer.setPosition(defender.x, defender.y)
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