import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "./attack-keys.js"
import { ATTACK_TARGET } from "./attack-manager.js"

export class ConfuseRay extends Attack {
  /** @protected @type {Phaser.GameObjects.Container} */
  _attackGameObjectContainer
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject1
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject2
  /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject3
    /** @protected @type {Phaser.GameObjects.Sprite} */
  _attackGameObject4
  /** @type {import("../../types/typedef.js").Coordinate} */
  #playerCoords
  /** @type {import("../../types/typedef.js").Coordinate} */
  #enemyCoords
  /** @type {string} */
  #target
  /** @type {Phaser.GameObjects.Sprite[]} */
  #frames

  /**
   * 
   * @param {Phaser.Scene} scene
   * @param {import("../../types/typedef.js").Coordinate} playerCoords
   * @param {import("../../types/typedef.js").Coordinate} enemyCoords
   * @param {string} target
   */
  constructor (scene, playerCoords, enemyCoords, target) {
    super(scene, target === ATTACK_TARGET.PLAYER ? enemyCoords : playerCoords)
    this.#enemyCoords = enemyCoords
    this.#playerCoords = playerCoords
    this.#target = target

    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.RAY, 3)
      .setOrigin(0).setAlpha(0)

    this._attackGameObject2 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.RAY, 2)
      .setOrigin(0).setAlpha(0)
  
    this._attackGameObject3 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.RAY, 1)
      .setOrigin(0).setAlpha(0)

    this._attackGameObject4 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.RAY, 0)
      .setOrigin(0).setAlpha(0)

    this.#frames = [
      this._attackGameObject1,
      this._attackGameObject2,
      this._attackGameObject3,
      this._attackGameObject4
    ]

    this._attackGameObjectContainer = this._scene.add.container(0, 0, [
      this._attackGameObject1,
      this._attackGameObject2,
      this._attackGameObject3,
      this._attackGameObject4
    ]).setAlpha(0)
  }

  /**
   * @param {string} val
   */
  set target (val) {
    this.#target = val
  }

  /**
   * @param {() => void} [callback]
   * @returns {void}
   */
  playAnimation (callback) {
    if (this._isAnimationPlaying) {
      return
    }

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_KEYS.CONFUSE_RAY, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      this.#playConfuseRayAnimation()
    ]

    Promise.all(promises).then(() => {
      if (callback) {
        callback()
      }
    })
  }

  /**
   * @returns {Promise}
   */
  #playConfuseRayAnimation () {
    return new Promise(resolve => {
      this._isAnimationPlaying = true
      this._attackGameObjectContainer.setAlpha(1)
      let remaining = this.#frames.length

      let targetCoords = {
        x: this.#enemyCoords.x - 60,
        y: this.#enemyCoords.y - 35
      }

      let originCoords = {
        x: this.#playerCoords.x + 60,
        y: this.#playerCoords.y - 35
      }

      if (this.#target === ATTACK_TARGET.PLAYER) {
        const temp = targetCoords
        targetCoords = originCoords
        originCoords = temp
      }
      
      this.#frames.forEach((frame, i) => {
        frame.setPosition(originCoords.x, originCoords.y)
        const delay = i * 60

        this._scene.tweens.add({
          targets: frame,
          delay,
          duration: 350,
          x: targetCoords.x,
          y: targetCoords.y,
          onStart: () => {
            frame.setAlpha(1)
          },
          onComplete: () => {
            remaining--
            frame.setAlpha(0)
            if (remaining === 0) {
              this._scene.time.delayedCall(delay, () => {
                this._isAnimationPlaying = false
                this._attackGameObjectContainer.setAlpha(0)
                return resolve()
              })
            }
          }
        })
      })
    })
  }
}