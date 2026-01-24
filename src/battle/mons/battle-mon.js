import Phaser from "../../lib/phaser.js"
import { HealthBar } from "../../common/health-bar.js" 
import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS, SFX_ASSET_KEYS } from "../../assets/asset-keys.js"
import { AudioManager } from "../../utils/audio-manager.js"
import { MON_TYPES } from "../../types/mon-types.js"
import { MonCore } from "../../common/mon-core.js"
import { ExpBar } from "../../common/exp-bar.js"
import { STATUS_EFFECT } from "../../types/status-effect.js"
import { exhaustiveGuard } from "../../utils/guard.js"

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

  /**
   * 
   * @param {number} damage
   * @param {object} config
   * @param {string} config.sfxAssetKey 
   * @param {() => void} config.callback
   * @param {boolean} [config.skipAnimation=false]
   * @returns 
   */
  playMonTakeDamageSequence (damage, config) {
    if (!damage) {
      config.callback()
      return
    }
    
    this.#audioManager.playSfx(config.sfxAssetKey, { primaryAudio: true })
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
    let statusText = ''

    switch (status) {
      case STATUS_EFFECT.FREEZE:
        statusText = 'FRZN'
        break
      case STATUS_EFFECT.BURN:
        statusText = 'BRN'
        break
      case STATUS_EFFECT.CONFUSE:
        statusText = 'CONF'
        break
      case STATUS_EFFECT.PARALYSE:
        statusText = 'PRZD'
        break
      default:
        exhaustiveGuard(status)
        break
    }

    // todo animations
    this._currentStatusEffect = status
    this._monLvlGameText.setText(statusText)
    this._statusEffectRemovalAttempts = 0
    callback()
  }

  /**
   * 
   * @returns {{
   *  result: boolean,
   *  statusEffect: import("../../types/status-effect.js").StatusEffect
   * }}
   */
  rollStatusEffectRemoval () {
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
    this._phaserMonImageGameObject = this._scene.add.image(pos.x, pos.y, this._battleSpriteAssetKey, this._baseMonDetails.assetFrame).setOrigin(0).setAlpha(0)
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
}