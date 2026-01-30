import Phaser from "../../lib/phaser.js"
import { ATTACK_ASSET_KEYS } from "../../assets/asset-keys.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "./attack-keys.js"

export class PoisonPowder extends Attack {

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
    console.log(this._isAnimationPlaying)
    if (this._isAnimationPlaying) {
      callback()
      return
    }

    const promises = [
      new Promise(resolve => {
        this._audioManager.playSfx(ATTACK_KEYS.POISON_POWDER, {
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