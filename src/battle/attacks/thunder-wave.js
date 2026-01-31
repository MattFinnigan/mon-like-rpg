import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../generated/attack-asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "../../generated/attack-keys.js"

export class ThunderWave extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObjectContainer
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    super(scene)

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.ELECTRIC, 0)
      .setOrigin(0.5, 0.3).setScale(1.5)

    this._attackGameObjectContainer = this._scene.add.container(0, 0, [
      this._attackGameObject1
    ]).setAlpha(0)

    this.#createAnimation()
  }

  #createAnimation () {
    const anim = {
      key: ATTACK_KEYS.THUNDER_WAVE,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.ELECTRIC, { frames: [0, 1, 2, 3]}),
      frameRate: 12,
      repeat: 3,
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
      return
    }
    
    this._isAnimationPlaying = true
    this._attackGameObjectContainer.setPosition(defender.x, defender.y)
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