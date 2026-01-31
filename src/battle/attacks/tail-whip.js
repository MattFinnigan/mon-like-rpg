import Phaser from "../../lib/phaser.js"
import { Attack } from "./attack.js"
import { ATTACK_KEYS } from "../../generated/attack-keys.js"

export class TailWhip extends Attack {

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
        this._audioManager.playSfx(ATTACK_KEYS.TAIL_WHIP, {
          primaryAudio: true,
          callback: () => resolve()
        })
      }),
      new Promise(resolve => {
        const baseX = attacker.x
        this._scene.add.tween({
          targets: attacker,
          x: {
            from: baseX - 16,
            to: baseX + 16,
            finish: baseX
          },
          duration: 150,
          yoyo: true,
          repeat: 2,
          easing: Phaser.Math.Easing.Sine.InOut,
          onComplete: () => {
            attacker.x = baseX
            resolve()
          }
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }  
}