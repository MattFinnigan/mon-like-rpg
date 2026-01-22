import { exhaustiveGuard } from "../../utils/guard.js"
import { ATTACK_KEYS } from "./attack-keys.js"
import { IceShard } from "./ice-shard.js"
import { Slash } from "./slash.js"
import { FireSpin } from './fire-spin.js'
import { BattleMon } from "../mons/battle-mon.js"
import { MON_TYPES } from "../../types/mon-types.js"
import { SKIP_ANIMATIONS } from "../../../config.js"
import { STATUS_EFFECT } from "../../types/status-effect.js"
import Phaser from "../../lib/phaser.js"
import { Splash } from "./splash.js"
import { ThunderWave } from "./thunder-wave.js"
import { ConfuseRay } from "./confuse-ray.js"
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
  /** @type {Splash} */
  #splashAttack
  /** @type {ThunderWave} */
  #thunderWaveAttack
  /** @type {ConfuseRay} */
  #confuseRayAttack

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
   * @param {import("./attack-keys").AttackKeys} attackAnim 
   * @param {string} target 
   * @param {() => void} callback
   * @param {boolean} noDamageTaken
   * @returns {void}
   */
  playAttackAnimation (attackAnim, target, callback, noDamageTaken) {
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

    switch (attackAnim) {
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
      case ATTACK_KEYS.SPLASH:
        if (!this.#splashAttack) {
          this.#splashAttack = new Splash(this.#scene, { x, y })
        }
        this.#splashAttack.gameObject.setPosition(x, y)
        this.#splashAttack.playAnimation(callback)
        break
      case ATTACK_KEYS.THUNDER_WAVE:
        if (!this.#thunderWaveAttack) {
          this.#thunderWaveAttack = new ThunderWave(this.#scene, { x, y })
        }
        this.#thunderWaveAttack.gameObject.setPosition(x, y)
        this.#thunderWaveAttack.playAnimation(callback)
        break
      case ATTACK_KEYS.CONFUSE_RAY:
        if (!this.#confuseRayAttack) {
          this.#confuseRayAttack = new ConfuseRay(this.#scene, { x, y })
        }
        this.#confuseRayAttack.gameObject.setPosition(x, y)
        this.#confuseRayAttack.playAnimation(callback)
        break
      default:
        exhaustiveGuard(attackAnim)
    }

  }
  
  /**
   * 
   * @param {BattleMon} attacker 
   * @param {BattleMon} defender 
   * @param {import("../../types/typedef.js").Attack} attack 
   * @param {string} target 
   * @param {(result: import("../../types/typedef.js").PostAttackResult) => void} callback 
   */
  playAttackSequence (attacker, defender, attack, target, callback) {
    const damageRes = this.#calculateAttackDamage(attacker, defender, attack)
    const result = {
      damage: damageRes,
      statusEffect: !damageRes.wasImmune ? this.#determineStatusEffect(defender, attack) : null
    }

    const waitTime = result.damage.damageTaken > 0 ? 500 : 0
    this.#scene.time.delayedCall(waitTime, () => {
      this.playAttackAnimation(
        attack.animationName,
        target,
        () => callback(result),
        result.damage.damageTaken === 0 || SKIP_ANIMATIONS
      )
    })
  }

  /**
   * 
   * @param {BattleMon} defender 
   * @param {import("../../types/typedef.js").Attack} attack
   * @returns {import("../../types/status-effect.js").StatusEffect|null}
   */
  #determineStatusEffect (defender, attack) {
    if (!attack.opponentStatusEffect || defender.currentStatusEffect) {
      return null
    }

    const willBeApplied = Phaser.Math.Between(1, 100) <= attack.opponentStatusEffect.chancePercentage
  
    if (!willBeApplied) {
      return null
    }

    return attack.opponentStatusEffect.name
  }

  /**
   * 
   * @param {BattleMon} attacker 
   * @param {BattleMon} defender 
   * @param {import("../../types/typedef.js").Attack} attackMove 
   * @returns {import("../../types/typedef.js").PostAttackDamageResult}
   * 
   */
  #calculateAttackDamage (attacker, defender, attackMove) {
    const aLevel = attacker.currentLevel
    const aStats = attacker.monStats
    const attkPwr = attackMove.power
    const attackMoveType = MON_TYPES[attackMove.typeKey] 

    const effectiveAttack = attackMove.usesMonSplStat ? aStats.splAttack : aStats.attack
    const effectiveDefense = attackMove.usesMonSplStat ? defender.monStats.splDefense : defender.monStats.defense
    const stabMod = attacker.types.find(t => attackMoveType.name === t.name) ? 1.5 : 1
    let critMod = 1
    let typeMod = 1
    
    const monTypesFlat = defender.baseMonDetails.types.map(type => type.name)
    const wasImmune = !!defender.baseMonDetails.types.find(defenderType => {
      return defenderType.immuneTo.find(immuneTo => immuneTo === attackMove.typeKey)
    })
    const wasSuperEffective = !!attackMoveType.superEffectiveAgainst.find(am => monTypesFlat.indexOf(am) !== -1)
    const wasResistant = !!defender.baseMonDetails.types.find(mt => mt.resistantAgainst.indexOf(attackMoveType.name) !== -1)
    let wasCriticalHit = wasImmune
      ? false
      : Phaser.Math.Between(attackMove.criticalHitModifier, 16) === 16

    if (wasCriticalHit) {
      critMod = 2
    }
    
    if (wasSuperEffective) {
      typeMod = 2
    } else if (wasResistant) {
      typeMod = 0.5
    } else if (wasImmune) {
      typeMod = 0
    }

    const res = {
      damageTaken: Math.floor((((2 * aLevel * critMod) / 50 + 2) * (attkPwr / 10) * (effectiveAttack / effectiveDefense)) * stabMod * typeMod),
      wasCriticalHit,
      wasSuperEffective,
      wasImmune,
      wasResistant
    }
    return res
  }
}