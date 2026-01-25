import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "./attack-keys.js"

export class Splash extends Attack {
  /** @type {Phaser.GameObjects.Image} */
  #monImageGameObject

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef.js").Coordinate} position
   * @param {Phaser.GameObjects.Image} monImageGameObject
   */
  constructor (scene, position, monImageGameObject) {
    super(scene, position)
    this.#monImageGameObject = monImageGameObject
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
        this._audioManager.playSfx(ATTACK_KEYS.SPLASH, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        const flailRight = () => {
          this._scene.tweens.add({
            targets: this.#monImageGameObject,
            angle: -8,
            y: this.#monImageGameObject.y + 32,
            duration: 100,
            yoyo: true,
            onComplete: () => {
              resolve()
            }
          })
        }

        const flailLeft = () => {
          this._scene.tweens.add({
            targets: this.#monImageGameObject,
            angle: 8,
            duration: 100,
            yoyo: true,
            onComplete: () => {
              flailRight()
            }
          })
        }

        flailLeft()
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }  
}