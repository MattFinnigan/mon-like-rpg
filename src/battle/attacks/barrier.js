import { ATTACK_ASSET_KEYS } from "../../generated/attack-asset-keys.js"
import { ATTACK_KEYS } from "../../generated/attack-keys.js"
import Phaser from "../../lib/phaser.js"
import { ATTACK_TARGET } from "./attack-manager.js"
import { Attack } from "./attack.js"

export class Barrier extends Attack {
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
    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.BARRIER, 0)
      .setOrigin(0.5, 0.3).setScale(1.5)

    this._attackGameObjectContainer = this._scene.add.container(0, 0, [
      this._attackGameObject1
    ]).setAlpha(0)

    this.#createAnimation()
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
    this._attackGameObjectContainer.setAlpha(1)
    this._attackGameObject1.play(ATTACK_KEYS.BARRIER)

    let coords = {
      x: attacker.x + 95,
      y: attacker.y - 50
    }

    if (this.target === ATTACK_TARGET.PLAYER) {
      this._attackGameObject1.setAngle(180)
      coords.y = attacker.y + 75
      coords.x = attacker.x - 65
    } else {
      this._attackGameObject1.setAngle(0)
    }

    this._attackGameObjectContainer.setPosition(coords.x, coords.y)

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_KEYS.BARRIER, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_KEYS.BARRIER, () => {
          this._isAnimationPlaying = false
          this._attackGameObjectContainer.setAlpha(0)
          this._attackGameObject1.setFrame(0)
          resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }

  #createAnimation () {
    const anim = {
      key: ATTACK_KEYS.BARRIER,
      frames: this._scene.anims.generateFrameNumbers(ATTACK_ASSET_KEYS.BARRIER, { frames: [0, 1, 2, 3, 4]}),
      frameRate: 21,
      repeat: 0,
      yoyo: true
    }

    this._scene.anims.create(anim)
  }
}