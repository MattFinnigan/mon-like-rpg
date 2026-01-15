import { exhaustiveGuard } from "../../utils/guard.js"
import { ATTACK_KEYS } from "./attack-keys.js"
import { IceShard } from "./ice-shard.js"
import { Slash } from "./slash.js"
import { FireSpin } from './fire-spin.js'
/**
 * @typedef {keyof typeof ATTACK_TARGET} AttackTarget
 */

/** @enum {AttackTarget} */
export const ATTACK_TARGET = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY'
})


export class AttackManager {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {boolean} */
  #skipBattleAnimations
  /** @type {IceShard} */
  #iceShardAttack
  /** @type {Slash} */
  #slashAttack
  /** @type {FireSpin} */
  #fireWheelAttack

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {boolean} skipBattleAnimations 
   */
  constructor (scene, skipBattleAnimations) {
    this.#scene = scene
    this.#skipBattleAnimations = skipBattleAnimations
  }
  /**
   * 
   * @param {import("./attack-keys").AttackKeys} attack 
   * @param {string} target 
   * @param {() => void} callback
   * @param {boolean} noDamageTaken
   * @returns {void}
   */
  playAttackAnimation (attack, target, callback, noDamageTaken) {
    if (this.#skipBattleAnimations || noDamageTaken) {
      callback()
      return
    }

    let x = 500
    let y = 100
    if (target === ATTACK_TARGET.PLAYER) {
      x = 150
      y = 300
    }

    switch (attack) {
      case ATTACK_KEYS.ICE_SHARD:
        if (!this.#iceShardAttack) {
          this.#iceShardAttack = new IceShard(this.#scene, { x, y })
        }
        this.#iceShardAttack.gameObject.setPosition(x, y)
        this.#iceShardAttack.playAnimation(callback)
        break
      case ATTACK_KEYS.SLASH:
        if (!this.#slashAttack) {
          this.#slashAttack = new Slash(this.#scene, { x, y })
        }
        this.#slashAttack.gameObject.setPosition(x, y)
        this.#slashAttack.playAnimation(callback)
        break
      case ATTACK_KEYS.FIRE_SPIN:
        if (!this.#fireWheelAttack) {
          this.#fireWheelAttack = new FireSpin(this.#scene, { x, y })
        }
        this.#fireWheelAttack.gameObject.setPosition(x, y)
        this.#fireWheelAttack.playAnimation(callback)
        break
      default:
        exhaustiveGuard(attack)
    }

  }
}