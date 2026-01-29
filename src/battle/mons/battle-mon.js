import Phaser from "../../lib/phaser.js"
import { HealthBar } from "../../common/health-bar.js" 
import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS, SFX_ASSET_KEYS, STATUS_EFFECT_ASSET_KEYS } from "../../assets/asset-keys.js"
import { AudioManager } from "../../utils/audio-manager.js"
import { MON_TYPES } from "../../types/mon-types.js"
import { MonCore } from "../../common/mon-core.js"
import { ExpBar } from "../../common/exp-bar.js"
import { STATUS_EFFECT } from "../../types/status-effect.js"
import { exhaustiveGuard } from "../../utils/guard.js"
import { Attack } from "../attacks/attack.js"

export class BattleMon extends MonCore  {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected  @type {Phaser.GameObjects.Image} */
  _phaserMonImageGameObject
  /** @protected  @type {Phaser.GameObjects.Image} */
  _phaserMonDetailsBackgroundImageGameObject
  /** @protected @type {HealthBar} */
  _healthBar
  /** @protected  @type {Phaser.GameObjects.Container} */
  _phaserHealthBarGameContainer
  /** @protected @type {Phaser.GameObjects.BitmapText} */
  _monNameGameText
  /** @protected @type {Phaser.GameObjects.BitmapText} */
  _monLvlGameText
  /** @protected @type {Phaser.GameObjects.BitmapText} */
  _monHpLabelGameText
  /** @protected @type {boolean} */
  _skipBattleAnimations
  /** @protected @type {string} */
  _battleSpriteAssetKey
  /** @type {boolean} */
  #showHpNumsExpBar
  /** @protected @type {ExpBar} */
  _expBar
  /** @protected @type {import("../../types/status-effect.js").StatusEffect|null} */
  _currentStatusEffect
  /** @type {number} */
  _statusEffectRemovalAttempts
  /** @type {AudioManager} */
  #audioManager
  /** @type {import("../../types/typedef.js").Attack} */
  #lastAttackUsed
  /** @type {boolean} */
  #isCharging
  /** @type {number} */
  #turnsLeftToFinishCharging
  /** @type {number} */
  #turnsLeftToFinishCoolingDown
  /** @type {boolean} */
  #isCoolingDown

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config
   * @param {import("../../types/typedef.js").Coordinate} pos
   * @param {boolean} [showHpNumsExpBar=false]
    */
  constructor (config, pos = { x: 0, y: 0 }, showHpNumsExpBar) {
    super(config.scene, config.monDetails)
    this._scene = config.scene
    this._skipBattleAnimations = config.skipBattleAnimations
    this._battleSpriteAssetKey = this._baseMonDetails.assetKey
    this.#showHpNumsExpBar = showHpNumsExpBar
    this._statusEffectRemovalAttempts = 0
    this.#audioManager = this._scene.registry.get('audio')

    this.#lastAttackUsed = undefined
    this.#turnsLeftToFinishCharging = 0
    this.#turnsLeftToFinishCoolingDown = 0
    this.#isCharging = false
    this.#isCoolingDown = false

    this.#createMonGameObject(pos)
    this.#createMonDetailsGameObject()
    this.#createHealthBarComponents()
  }

  /** @returns {boolean} */
  get isFainted () {
    return this._currentHealth <= 0
  }

  /** @returns {string} */
  get name () {
    return this._monDetails.name
  }

  /** @returns {number} */
  get currentLevel () {
    return this._monDetails.currentLevel
  }

  /** @returns {import("../../types/typedef.js").Attack[]} */
  get attacks () {
    return [...this._monAttacks]
  }

  /** @returns {import("../../types/typedef.js").MonStats} */
  get monStats () {
    return this._monStats
  }

  /** @returns {import("../../types/typedef.js").Type[]} */
  get types () {
    return this._baseMonDetails.types
  }

  /** @returns {import("../../types/typedef.js").BaseMon} */
  get baseMonDetails () {
    return this._baseMonDetails
  }

  /** @returns {import("../../types/typedef.js").Mon} */
  get monDetails () {
    return this._monDetails
  }

  /** @returns {import("../../types/status-effect.js").StatusEffect|null} */
  get currentStatusEffect () {
    return this._currentStatusEffect
  }

  /** @returns {Phaser.GameObjects.Image} */
  get phaserMonImageGameObject () {
    return this._phaserMonImageGameObject
  }

  /** @type {import("../../types/typedef.js").Attack|undefined} */
  get lastAttackUsed () {
    return this.#lastAttackUsed
  }

  /** @param {import("../../types/typedef.js").Attack} val */
  set lastAttackUsed (val) {
    this.#lastAttackUsed = val
  }

  /** @type {number} */
  get turnsLeftToFinishCharging () {
    return this.#turnsLeftToFinishCharging
  }

  /** @param {number} val */
  set turnsLeftToFinishCharging (val) {
    this.#turnsLeftToFinishCharging = val
  }

  /** @type {number} */
  get turnsLeftToFinishCoolingDown () {
    return this.#turnsLeftToFinishCoolingDown
  }

  /** @param {number} val */
  set turnsLeftToFinishCoolingDown (val) {
    this.#turnsLeftToFinishCoolingDown = val
  }

  /** @type {boolean} */
  get isCharging () {
    return this.#isCharging
  }

  /** @param {boolean} val */
  set isCharging (val) {
    this.#isCharging = val
  }

  /** @type {boolean} */
  get isCoolingDown () {
    return this.#isCoolingDown
  }

  /**
   * 
   * @param {number} damage
   * @param {object} config
   * @param {string} [config.sfxAssetKey]
   * @param {() => void} config.callback
   * @param {boolean} [config.skipAnimation=false]
   * @returns 
   */
  playMonTakeDamageSequence (damage, config) {
    if (!damage) {
      config.callback()
      return
    }
    
    if (config.sfxAssetKey) {
      this.#audioManager.playSfx(config.sfxAssetKey, { primaryAudio: true })
    }

    if (config.skipAnimation) {
      this._takeDamage(damage, () => {
        config.callback()
      })
      return
    }

    this.#playMonTakeDamageAnimation(() => {
      this._takeDamage(damage, () => {
        config.callback()
      })
    })
  }

  /**
   * 
   * @param {number} damage
   * @param {() => void} callback 
   */
  _takeDamage (damage, callback) {
    // update current hp, animate hp bar
    this._currentHealth -= damage
    if (this._currentHealth < 0) {
      this._currentHealth = 0
    }

    this._healthBar.setMeterPercentageAnimated(this._currentHealth, this._currentHealth / this._maxHealth, { callback })
  }

  /**
   * 
   * @param {import("../../types/status-effect.js").StatusEffect|null} status 
   * @param {() => void} callback 
   */
  applyStatusEffect (status, callback) {
    this._statusEffectRemovalAttempts = 0
    this._currentStatusEffect = status

    switch (status) {
      case STATUS_EFFECT.FREEZE:
        this.#playFrozenAnim(() => {
          this._monLvlGameText.setText('FRZN')
          callback()
        })
        break
      case STATUS_EFFECT.BURN:
        this.#playBurntAnim(() => {
          this._monLvlGameText.setText('BRN')
          callback()
        })
        break
      case STATUS_EFFECT.CONFUSE:
        this.#playConfusedAnim(() => {
          this._monLvlGameText.setText('CONF')
          callback()
        })
        break
      case STATUS_EFFECT.PARALYSE:
        this._monLvlGameText.setText('PARA')
        callback()
        break
      default:
        exhaustiveGuard(status)
        break
    }
    
  }

  /**
   * 
   * @returns {{
   *  result: boolean,
   *  statusEffect: import("../../types/status-effect.js").StatusEffect
   * }}
   */
  #rollStatusEffectRemoval () {
    const statusEffect = this._currentStatusEffect
    let result = false
    
    this._statusEffectRemovalAttempts++

    switch (statusEffect) {
      case STATUS_EFFECT.FREEZE:
        result = Phaser.Math.Between(this._statusEffectRemovalAttempts, 10) === 10
        break
      case STATUS_EFFECT.CONFUSE:
        result = Phaser.Math.Between(this._statusEffectRemovalAttempts, 5) === 5
      case STATUS_EFFECT.BURN:
      case STATUS_EFFECT.PARALYSE:
        break
      default:
        exhaustiveGuard(statusEffect)
        break
    }

    if (result) {
      this._monLvlGameText.setText(`Lv${this._currentLevel}`)
      this._currentStatusEffect = null
      this._statusEffectRemovalAttempts = 0
    }

    return { statusEffect, result }
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playMonAppearAnimation (callback) {
    throw new Error('playMonAppearAnimation is not implemented')
  }

  /**
   * 
   * @param {import("../../types/typedef.js").Item} item
   * @param {(result: {
   *   msg: string,
   *   wasSuccessful: boolean
   * }) => void} callback
   */
  playCatchAttempt (item, callback) {
    console.log('hello')
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  #playMonTakeDamageAnimation (callback) {
    if (this._skipBattleAnimations) {
      callback()
      return
    }
    this._scene.tweens.add({
      delay: 0,
      duration: 150,
      targets: this._phaserMonImageGameObject,
      alpha: {
        from: 0,
        start: 1,
        to: 1
      },
      repeat: 5,
      onComplete: () => {
        callback()
      }
    })
  }
  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation (callback) {
    throw new Error('playDeathAnimation is not implemented')
  }

  #createHealthBarComponents () {
    this._monNameGameText = this._scene.add.bitmapText(0, 2, 'gb-font', this.name, 40)
    this._monLvlGameText = this._scene.add.bitmapText(144, 44, 'gb-font-thick', `Lv${this.currentLevel}`, 30)
    this._monHpLabelGameText = this._scene.add.bitmapText(30, 76, 'gb-font-thick', `HP:`, 20)
    this._healthBar = new HealthBar(this._scene, 72, 42, this._currentHealth, this._maxHealth, { showHpNums: this.#showHpNumsExpBar })
    this._typeContainers.setAlpha(1)
    this._expBar = new ExpBar(this._scene, {
      x: 290,
      y: 140,
      currentExp: this._monDetails.currentExp,
      currentLevel: this._monDetails.currentLevel
    })

    if (!this.#showHpNumsExpBar) {
      this._expBar.container.setAlpha(0)
    }

    this._phaserHealthBarGameContainer = this._scene.add.container(20, 0, [
      this._phaserMonDetailsBackgroundImageGameObject,
      this._monNameGameText,
      this._monLvlGameText,
      this._monHpLabelGameText,
      this._healthBar.container,
      this._typeContainers,
      this._expBar.container
    ]).setAlpha(0)
  }
  
  hideBattleDetails () {
    this._phaserHealthBarGameContainer.setAlpha(0)
  }

  /**
   * 
   * @param {import("../../types/typedef.js").Coordinate} pos 
   */
  #createMonGameObject (pos) {
    this._phaserMonImageGameObject = this._scene.add.image(pos.x, pos.y, this._battleSpriteAssetKey, this._baseMonDetails.assetFrame)
      .setAlpha(0)
      .setDepth(-1)
      .setScale(1.3)
  }

  #createMonDetailsGameObject () {
    this._phaserMonDetailsBackgroundImageGameObject = this._scene.add.image(0, 12, BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND).setOrigin(0)
  }

  /**
   * 
   * @param {number} hp 
   * @param {() => void} callback 
   */
  healHp (hp, callback) {
    // update current hp, animate hp bar
    this._currentHealth += hp
    if (this._currentHealth > this._maxHealth) {
      this._currentHealth = this._maxHealth
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth, this._currentHealth / this._maxHealth, { callback })
  }

  /**
   * 
   * @param {number} exp 
   * @param {(leveledUp: boolean, evolved: boolean) => void} callback 
   */
  gainExperience (exp, callback) {
    this._currentExp += exp
    this._expBar.setMeterPercentageAnimated(this._currentExp, {
      callback: (levelsGained) => {
        if (levelsGained > 0) {
          this._currentLevel += levelsGained
          if (!this._currentStatusEffect) {
            this._monLvlGameText.setText(`Lv${this._currentLevel}`)
          }
          
          const evolved = this._baseMonDetails.evolvesTo ? this._baseMonDetails.evolvesAtLevel <= this._currentLevel : false

          callback(true, evolved)
          return
        }
        callback(false, false)
      }
    })
  }

  /**
   * 
   * @param {() => void} [callback] 
   */
  _playFaintThud (callback) {
    this.#audioManager.playSfx(SFX_ASSET_KEYS.FAINT_THUD, {
      callback: () => {
        if (callback) {
          callback()
        }
      }
    })
  }

  /**
   * @param {() => void} callback
   */
  #playBurntAnim (callback) {
    const sprite = this._scene.add.sprite(this._phaserMonImageGameObject.x - 35, this._phaserMonImageGameObject.y + 40, STATUS_EFFECT_ASSET_KEYS.BURNT, 0).setScale(1.5)
    sprite.play(STATUS_EFFECT_ASSET_KEYS.BURNT)

    const promises = [
      new Promise(resolve => {
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + STATUS_EFFECT_ASSET_KEYS.BURNT, () => {
          sprite.setAlpha(0)
          resolve()
        })
      }),
      new Promise(resolve => {
        this.#audioManager.playSfx(STATUS_EFFECT_ASSET_KEYS.BURNT, {
          primaryAudio: true,
          callback: () => resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }

  /**
   * @param {() => void} callback
   */
  #playParalyzedAnim (callback) {
    const promises = [
      new Promise(resolve => {
        const leftInnerSprite = this._scene.add.sprite(this._phaserMonImageGameObject.x - 85, this._phaserMonImageGameObject.y, STATUS_EFFECT_ASSET_KEYS.PARALYZED, 0).setScale(1.75)
        const rightInnerSprite = this._scene.add.sprite(this._phaserMonImageGameObject.x + 85, this._phaserMonImageGameObject.y, STATUS_EFFECT_ASSET_KEYS.PARALYZED, 1).setScale(1.75)

        const leftOuterSprite = this._scene.add.sprite(this._phaserMonImageGameObject.x - 105, this._phaserMonImageGameObject.y + 10, STATUS_EFFECT_ASSET_KEYS.PARALYZED, 2).setScale(1.75).setAlpha(0)
        const rightOuterSprite = this._scene.add.sprite(this._phaserMonImageGameObject.x + 105, this._phaserMonImageGameObject.y + 10, STATUS_EFFECT_ASSET_KEYS.PARALYZED, 3).setScale(1.75).setAlpha(0)

        const flashes = 5
        const flashDuration = 49

        let flashCount = 0

        this._scene.tweens.add({
          targets: { dummy: 0 },
          dummy: 1,
          duration: flashDuration,
          yoyo: true,
          repeat: flashes - 1,
          onRepeat: () => {
            const visible = leftInnerSprite.alpha === 1
            leftInnerSprite.setAlpha(visible ? 0 : 1)
            rightInnerSprite.setAlpha(visible ? 0 : 1)
            leftOuterSprite.setAlpha(visible ? 1 : 0)
            rightOuterSprite.setAlpha(visible ? 1 : 0)
            
            flashCount++
          },
          onComplete: () => {
            leftInnerSprite.setAlpha(0)
            rightInnerSprite.setAlpha(0)
            leftOuterSprite.setAlpha(0)
            rightOuterSprite.setAlpha(0)
            resolve()
          }
        })

      }),
      new Promise(resolve => {
        this.#audioManager.playSfx(STATUS_EFFECT_ASSET_KEYS.PARALYZED, {
          primaryAudio: true,
          callback: () => resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }

  /**
   * @param {() => void} callback
   */
  #playConfusedAnim (callback) {
    const promises = [
      new Promise(resolve => {
        const sprite1 = this._scene.add.sprite(this._phaserMonImageGameObject.x, this._phaserMonImageGameObject.y - 90, STATUS_EFFECT_ASSET_KEYS.CONFUSED, 0).setScale(1)
        const sprite2 = this._scene.add.sprite(this._phaserMonImageGameObject.x + 70, this._phaserMonImageGameObject.y - 75, STATUS_EFFECT_ASSET_KEYS.CONFUSED, 0)
          .setScale(1)
          .setAlpha(0)
          .setAngle(35)

        this._scene.time.delayedCall(500, () => {
          sprite2.setAlpha(1)
          this._scene.time.delayedCall(500, () => {
            sprite1.setAlpha(0)
            sprite2.setAlpha(0)
            resolve()
          })
        })

      }),
      new Promise(resolve => {
        this.#audioManager.playSfx(STATUS_EFFECT_ASSET_KEYS.CONFUSED, {
          primaryAudio: true,
          callback: () => resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }

  /**
   * @param {() => void} callback
   */
  #playFrozenAnim (callback) {
    const sprite = this._scene.add.sprite(this._phaserMonImageGameObject.x, this._phaserMonImageGameObject.y + 40, STATUS_EFFECT_ASSET_KEYS.FROZEN)
    sprite.play(STATUS_EFFECT_ASSET_KEYS.FROZEN)

    const promises = [
      new Promise(resolve => {
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + STATUS_EFFECT_ASSET_KEYS.FROZEN, () => {
          sprite.setAlpha(0)
          resolve()
        })
      }),
      new Promise(resolve => {
        this.#audioManager.playSfx(STATUS_EFFECT_ASSET_KEYS.FROZEN, {
          primaryAudio: true,
          callback: () => resolve()
        })
      })
    ]

    Promise.all(promises).then(() => {
      callback()
    })
  }

  /**
   * 
   * @param {(canAttack: boolean, msg?: string) => void} callback
   */
  checkMonCanAttack (callback) {
    this.#checkPreAttackMonStatusEffect((statusEffectPreventedAttack, statusMsg) => {
      if (!statusEffectPreventedAttack) {
        // nullify any charging moves in progress
        this.#lastAttackUsed = undefined
        this.#turnsLeftToFinishCharging = 0
        this.#isCharging = false
        callback(false, statusMsg)
        return
      }

      if (this.#isCoolingDown) {
        callback(false, `${this.name} ${this.#lastAttackUsed.coolDownMessage}`)
        return
      }

      callback(true)
    })
  }

  /**
   * 
   * @param {(canAttack: boolean, msg?: string) => void} callback
   */
  #checkPreAttackMonStatusEffect (callback) {
    /** @type {import("../../types/status-effect.js").StatusEffect[]} */
    const preAttackStatusEffects = [
      STATUS_EFFECT.FREEZE,
      STATUS_EFFECT.CONFUSE,
      STATUS_EFFECT.PARALYSE
    ]
    
    if (!preAttackStatusEffects.includes(this.currentStatusEffect)) {
      callback(true)
      return
    }

    const { result, statusEffect } = this.#rollStatusEffectRemoval()
    let canAttack = result
    let msg = ''

    switch (statusEffect) {
      case STATUS_EFFECT.FREEZE:
        msg = result
          ? `${this.name} thawed out!`
          : `${this.name} is frozen solid...`
        if (!result) {
          this.#playFrozenAnim(() => callback(canAttack, msg))
          return
        }
        callback(canAttack, msg)
        break
      case STATUS_EFFECT.CONFUSE:
        if (result) {
          msg = `${this.name} snapped out of their confusion!`
          callback(canAttack, msg)
          return
        }

        const hitSelf = Phaser.Math.Between(0, 1) === 1
        
        if (hitSelf) {
          this.#playConfusedAnim(() => {
            msg = `${this.name} hurt itself in confusion...`
            canAttack = false
            this.playMonTakeDamageSequence(this.maxHealth * 0.10,  {
              sfxAssetKey: SFX_ASSET_KEYS.TAKE_DAMAGE,
              callback: () => callback(canAttack, msg)
            })
          })
          return
        }
        callback(true)
        break
      case STATUS_EFFECT.PARALYSE:
        canAttack = Phaser.Math.Between(0, 1) === 1
        if (!canAttack) {
          this.#playParalyzedAnim(() => {
            msg = `${this.name} couldn't move!`
            callback(canAttack, msg)
          })
          return
        }
        callback(true)
        break
    }
  }

  /**
   * 
   * @param {(hadEffect: boolean, msg?: string) => void} callback
   */
  checkPostBattleTurnMonStatusEffect (callback) {
    /** @type {import("../../types/status-effect.js").StatusEffect[]} */
    const postBattleStatusEffects = [
      STATUS_EFFECT.BURN
    ]
    
    if (!postBattleStatusEffects.includes(this.currentStatusEffect)) {
      callback(false)
      return
    }

    const { statusEffect } = this.#rollStatusEffectRemoval()
    let msg = ''

    switch (statusEffect) {
      case STATUS_EFFECT.BURN:
        this.#playBurntAnim(() => {
          msg = `${this.name} was hurt by their burn.`
          this.playMonTakeDamageSequence(this.maxHealth * 0.10,  {
            skipAnimation: true,
            callback: () => callback(true, msg)
          })
        })
        break
      }
  }

  /** @returns {boolean} */
  updateMonsCooldownStatus () {
    if (this.#lastAttackUsed && this.#lastAttackUsed.turnsOnCooldown) {
      if (!this.#isCoolingDown) {
        this.#isCoolingDown = true
        this.#turnsLeftToFinishCoolingDown = this.#lastAttackUsed.turnsOnCooldown - 1
        return false
      }

      if (this.#turnsLeftToFinishCoolingDown) {
        this.#turnsLeftToFinishCoolingDown = this.#turnsLeftToFinishCoolingDown - 1
        return false
      }
    }
    this.#isCoolingDown = false
    return true
  }

  recalcMonStats () {
    const oldMax = this._maxHealth
    super.recalcMonStats()
    const diff = this._maxHealth - oldMax
    this._currentHealth += diff
    
    this._healthBar.updateMaxHealth(this._maxHealth)
  }
}