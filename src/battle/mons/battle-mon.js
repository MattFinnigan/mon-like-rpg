import Phaser from "../../lib/phaser.js"
import { HealthBar } from "../ui/health-bar.js"
import { BATTLE_ASSET_KEYS, DATA_ASSET_KEYS, MON_ASSET_KEYS } from "../../assets/asset-keys.js"
import { DataUtils } from "../../utils/data-utils.js"
import { AudioManager } from "../../utils/audio-manager.js"

export class BattleMon {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected @type {import("../../types/typedef.js").BaseMon} */
  _baseMonDetails
  /** @protected @type {import("../../types/typedef.js").Mon} */
  _monDetails
  /** @protected  @type {Phaser.GameObjects.Image} */
  _phaserMonImageGameObject
  /** @protected  @type {Phaser.GameObjects.Image} */
  _phaserMonDetailsBackgroundImageGameObject
  /** @protected @type {HealthBar} */
  _healthBar
  /** @protected @type {number} */
  _currentHealth
  /** @protected @type {number} */
  _maxHealth
  /** @protected @type {import("../../types/typedef.js").Attack[]} */
  _monAttacks
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
  /** @type {AudioManager} */
  #audioManager
  /** @protected @type {string} */
  _battleSpriteAssetKey
  /** @type {boolean} */
  #showHpNums

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config
   * @param {import("../../types/typedef.js").Coordinate} pos
   * @param {string | undefined} [battleSpriteAssetKey]
    */
  constructor (config, pos = { x: 0, y: 0 }, battleSpriteAssetKey, showHpNums = false) {
    this._scene = config.scene
    this._monDetails = config.monDetails
    this._baseMonDetails = config.baseMonDetails
    this._currentHealth = this._monDetails.currentHp
    this._maxHealth = this._monDetails.maxHp
    this._monAttacks = []
    this._skipBattleAnimations = config.skipBattleAnimations
    this._battleSpriteAssetKey = battleSpriteAssetKey || this._baseMonDetails.assetKey
    this.#showHpNums = showHpNums

    this._phaserMonImageGameObject = this._scene.add.image(pos.x, pos.y, this._battleSpriteAssetKey, this._baseMonDetails.assetFrame).setOrigin(0).setAlpha(0)
    this._phaserMonDetailsBackgroundImageGameObject = this._scene.add.image(0, 0 , BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND).setOrigin(0)
    this.#createHealthBarComponents()

    this._monDetails.attackIds.forEach(attkId => {
      const monAttk = DataUtils.getMonAttack(this._scene, attkId)
      if (monAttk !== undefined) {
        this._monAttacks.push(monAttk)
      }
    })

    this.#audioManager = this._scene.registry.get('audio')
  }

  /** @type {boolean} */
  get isFainted () {
    return this._currentHealth <= 0
  }

  /** @type {string} */
  get name () {
    return this._baseMonDetails.name
  }

  /** @type {number} */
  get currentLevel () {
    return this._monDetails.currentLevel
  }

  /** @type {import("../../types/typedef.js").Attack[]} */
  get attacks () {
    return [...this._monAttacks]
  }

  /** @type {number} */
  get baseAttack () {
    return this._baseMonDetails.baseAttack
  }

  /**
   * 
   * @param {number} damage 
   * @param {() => void} [callback] 
   */
  takeDamage (damage, callback) {
    // update current hp, animate hp bar
    this._currentHealth -= damage
    if (this._currentHealth < 0) {
      this._currentHealth = 0
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth, this._currentHealth / this._maxHealth, { callback })
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
   * @param {() => void} callback
   * @returns {void}
   */
  playMonHealthBarContainerAppearAnimation (callback) {
    throw new Error('playMonHealthBarContainerAppearAnimation is not implemented')
  }
  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playMonTakeDamageAnimation (callback) {
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
    this._monLvlGameText = this._scene.add.bitmapText(74, 44, 'gb-font-thick', `Lv${this.currentLevel}`, 30)
    this._monHpLabelGameText = this._scene.add.bitmapText(30, 76, 'gb-font-thick', `HP:`, 20)
    this._healthBar = new HealthBar(this._scene, 72, 42, this._currentHealth, this._maxHealth, this.#showHpNums)

    this._phaserHealthBarGameContainer = this._scene.add.container(20, 0, [
      this._phaserMonDetailsBackgroundImageGameObject,
      this._monNameGameText,
      this._monLvlGameText,
      this._monHpLabelGameText,
      this._healthBar.container
    ]).setAlpha(0)
  }

  playMonCry (callback) {
    if (this._skipBattleAnimations) {
      callback()
      return
    }
    this.#audioManager.playSfx(MON_ASSET_KEYS[this._baseMonDetails.assetKey], () => {
      callback()
    })
  }
}