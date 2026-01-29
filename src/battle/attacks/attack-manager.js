import { ATTACK_KEYS } from "./attack-keys.js"
import { IceShard } from "./ice-shard.js"
import { Slash } from "./slash.js"
import { FireSpin } from './fire-spin.js'
import { BattleMon } from "../mons/battle-mon.js"
import { MON_TYPES } from "../../types/mon-types.js"
import Phaser from "../../lib/phaser.js"
import { Splash } from "./splash.js"
import { ThunderWave } from "./thunder-wave.js"
import { ConfuseRay } from "./confuse-ray.js"
import { Attack } from "./attack.js"
import { HyperBeam } from "./hyper-beam.js"
import { SolarBeam } from "./solar-beam.js"
import { BattleMenu } from "../ui/menu/battle-menu.js"
/**
 * @typedef {keyof typeof ATTACK_TARGET} AttackTarget
 */

/** @enum {AttackTarget} */
export const ATTACK_TARGET = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY'
})

export const ATTACK_DEFINITIONS = {
  [ATTACK_KEYS.ICE_SHARD]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new IceShard(scene,)
  },
  [ATTACK_KEYS.SPLASH]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new Splash(scene)
  },
  [ATTACK_KEYS.CONFUSE_RAY]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new ConfuseRay(scene)
  },
  [ATTACK_KEYS.SLASH]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new Slash(scene)
  },
  [ATTACK_KEYS.THUNDER_WAVE]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new ThunderWave(scene)
  },
  [ATTACK_KEYS.FIRE_SPIN]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new FireSpin(scene)
  },
  [ATTACK_KEYS.HYPER_BEAM]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new HyperBeam(scene)
  },
  [ATTACK_KEYS.SOLAR_BEAM]: {
    /** @param {Phaser.Scene} scene */
    create: (scene) => new SolarBeam(scene)
  }
}

export class AttackManager {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.GameObjects.Image} */
  #playerMonImageGameObject
  /** @type {Phaser.GameObjects.Image} */
  #enemyMonImageGameObject
  /** @type {boolean} */
  #skipBattleAnimations
  /** @type {Map<import("./attack-keys").AttackKeys, any>} */
  #attackInstances = new Map()

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
   * @param {Phaser.GameObjects.Image} gameObj
   */
  set playerMonImageGameObject (gameObj) {
    this.#playerMonImageGameObject = gameObj
  }

  /**
   * @param {Phaser.GameObjects.Image} gameObj
   */
  set enemyMonImageGameObject (gameObj) {
    this.#enemyMonImageGameObject = gameObj
  }
  
  /**
   * 
   * @param {import("./attack-keys.js").AttackKeys} key 
   * @param {() => Attack} factory 
   * @returns {Attack}
   */
  #getAttackInstance (key, factory) {
    if (!this.#attackInstances.has(key)) {
      this.#attackInstances.set(key, factory())
    }
    return this.#attackInstances.get(key)
  }

  /**
   * 
   * @param {import("./attack-keys").AttackKeys} key
   * @param {object} config
   * @param {() => void} config.onAnimFinish
   * @param {'PLAYER'|'ENEMY'} config.target
   * @param {boolean} [config.isCharging]
   * @returns {void}
   */
  #playAttackAnimation (key, config) {
    const { onAnimFinish, target, isCharging } = config
    
    const def = ATTACK_DEFINITIONS[key]

    if (!def) {
      new Error(`Attack definition for ${key} not found.`)
      return
    }

    const attack = this.#getAttackInstance(key, () => {
      return def.create(this.#scene)
    })

    attack.target = target

    const attacker = target === ATTACK_TARGET.PLAYER ? this.#enemyMonImageGameObject : this.#playerMonImageGameObject
    const defender = target === ATTACK_TARGET.ENEMY ? this.#enemyMonImageGameObject : this.#playerMonImageGameObject

    if (isCharging) {
      attack.playChargingAnimation(attacker, defender, onAnimFinish)
      return
    }
    attack.playAnimation(attacker, defender, onAnimFinish)
  }
  
  /**
   * 
   * @param {BattleMon} attacker 
   * @param {BattleMon} defender 
   * @param {import("../../types/typedef.js").Attack} attack 
   * @param {'PLAYER'|'ENEMY'} target
   * @param {BattleMenu} battleMenu
   * @param {(result: import("../../types/typedef.js").PostAttackResult) => void} onAttackSequenceFinish 
   */
  playAttackSequence (attacker, defender, attack, target, battleMenu, onAttackSequenceFinish) {
    if (attack.turnsToCharge) {
      if (!attacker.isCharging) {
        attacker.isCharging = true
        attacker.turnsLeftToFinishCharging = attack.turnsToCharge
        this.#handleChargingAttack(attacker, attack, target, battleMenu, onAttackSequenceFinish)
        return
      }

      if (attacker.turnsLeftToFinishCharging) {
        this.#handleChargingAttack(attacker, attack, target, battleMenu, onAttackSequenceFinish)
        return
      }
    }
    attacker.isCharging = false

    battleMenu.updateInfoPanelMessagesNoInputRequired(`${attacker.name} used ${attack.name}!`, {
      callback: () => {
        const damageRes = this.#calculateAttackDamage(attacker, defender, attack)
        const result = {
          damage: damageRes,
          statusEffect: !damageRes.wasImmune ? this.#determineStatusEffect(defender, attack) : null
        }

        const waitTime = result.damage.damageTaken > 0 ? 500 : 0
        this.#scene.time.delayedCall(waitTime, () => {
          if (this.#skipBattleAnimations || (result.damage.damageTaken === 0 && attack.power !== 0)) {
            onAttackSequenceFinish(result)
            return
          }
          this.#playAttackAnimation(attack.animationName, {
            target,
            onAnimFinish: () => onAttackSequenceFinish(result)
          })
        })
      }
    })
  }

  /**
   * 
   * @param {BattleMon} attacker 
   * @param {import("../../types/typedef.js").Attack} attack 
   * @param {'PLAYER'|'ENEMY'} target
   * @param {BattleMenu} battleMenu
   * @param {(result: import("../../types/typedef.js").PostAttackResult) => void} onAttackSequenceFinish 
   */
  #handleChargingAttack (attacker, attack, target, battleMenu, onAttackSequenceFinish) {
    const result = {
      damage: {
        damageTaken: 0,
        wasCriticalHit: false,
        wasSuperEffective: false,
        wasImmune: false,
        wasResistant: false,
      },
      isCharging: true
    }

    attacker.turnsLeftToFinishCharging = attacker.turnsLeftToFinishCharging - 1

    this.#playAttackAnimation(attack.animationName, {
      target,
      isCharging: true,
      onAnimFinish: () => {
        battleMenu.updateInfoPanelMessagesNoInputRequired(`${attacker.name} ${attack.chargingMessage}`, {
          callback: () => {
            this.#scene.time.delayedCall(500, () => {
              onAttackSequenceFinish(result)
            })
          }
        })
      }
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
    
    if (wasSuperEffective && !wasResistant) {
      typeMod = 2
    } else if (wasResistant && !wasSuperEffective) {
      typeMod = 0.5
    } else if (wasImmune) {
      typeMod = 0
    }

    const res = {
      damageTaken: Math.floor((((2 * aLevel * critMod) / 50 + 2) * (attkPwr / 10) * (effectiveAttack / effectiveDefense)) * stabMod * typeMod),
      wasCriticalHit,
      wasSuperEffective: wasSuperEffective && !wasResistant,
      wasImmune,
      wasResistant: wasResistant && !wasSuperEffective
    }
    return res
  }
}