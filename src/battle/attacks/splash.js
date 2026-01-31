import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../generated/attack-asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "../../generated/attack-keys.js"

export class Splash extends Attack {

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    super(scene)
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
            targets: attacker,
            angle: -8,
            y: attacker.y + 32,
            duration: 100,
            yoyo: true,
            onComplete: () => {
              resolve()
            }
          })
        }

        const flailLeft = () => {
          this._scene.tweens.add({
            targets: attacker,
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