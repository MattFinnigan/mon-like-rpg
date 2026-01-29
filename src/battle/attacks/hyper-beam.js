import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "./attack-keys.js"
import { ATTACK_TARGET } from "./attack-manager.js"

export class HyperBeam extends Attack {
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

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.HYPER_BEAM, 0).setOrigin(0)
  
    this._attackGameObjectContainer = this._scene.add.container(0, 0, [
      this._attackGameObject1
    ]).setAlpha(0)

    super.createAttackAnimation(ATTACK_ASSET_KEYS.HYPER_BEAM)
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

    let coords = {
      x: attacker.x + 85,
      y: attacker.y - 185
    }

    if (this.target === ATTACK_TARGET.PLAYER) {
      this._attackGameObject1.setAngle(180)
      coords.y = attacker.y + 155
      coords.x = attacker.x - 55
    } else {
      this._attackGameObject1.setAngle(0)
    }

    this._isAnimationPlaying = true
    this._attackGameObjectContainer.setPosition(coords.x, coords.y)
    this._attackGameObjectContainer.setAlpha(1)
    this._attackGameObject1.play(ATTACK_ASSET_KEYS.HYPER_BEAM)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_KEYS.HYPER_BEAM, {
          primaryAudio: true,
          callback: () => {
            this._isAnimationPlaying = false
            this._attackGameObjectContainer.setAlpha(0)
            this._attackGameObject1.setFrame(0)
            resolve()
          }
        })
      }),
      new Promise(resolve => {
        this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.HYPER_BEAM, () => {
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