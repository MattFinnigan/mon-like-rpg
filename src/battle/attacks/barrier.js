import { ATTACK_KEYS } from "../../generated/attack-keys.js"
import Phaser from "../../lib/phaser.js"
import { Attack } from "./attack.js"

export class Barrier extends Attack {

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
        this._audioManager.playSfx(ATTACK_KEYS.BARRIER, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        this._scene.time.delayedCall(500, () => resolve())
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }  
}