import Phaser from "../../lib/phaser.js"
import { HealthBar } from "../../common/health-bar.js" 
import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS } from "../../assets/asset-keys.js"
import { DataUtils } from "../../utils/data-utils.js"
import { AudioManager } from "../../utils/audio-manager.js"
import { getMonStats } from "../../utils/battle-utils.js"
import { MON_TYPES } from "../../types/mon-types.js"

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
  /** @protected @type {import("../../types/typedef.js").MonStats} */
  _monStats
  /** @protected @type {Phaser.GameObjects.Container} */
  _typeContainers

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config
   * @param {import("../../types/typedef.js").Coordinate} pos
   * @param {boolean} [showHpNums=false]
    */
  constructor (config, pos = { x: 0, y: 0 }, showHpNums) {
    this._scene = config.scene
    this._monDetails = config.monDetails
    this._baseMonDetails = config.baseMonDetails
    this._currentHealth = this._monDetails.currentHp
    this._monAttacks = []
    this._skipBattleAnimations = config.skipBattleAnimations
    this._battleSpriteAssetKey = this._baseMonDetails.assetKey
    this.#showHpNums = showHpNums

    this._monStats = getMonStats(this._baseMonDetails, this._monDetails)
    this._maxHealth = this._monStats.hp

    this.#createMonGameObject(pos)
    this.#createMonDetailsGameObject()
    this.#createHealthBarComponents()
    this.#getMonAttacks()

    this.#audioManager = this._scene.registry.get('audio')
  }

  /** @type {boolean} */
  get isFainted () {
    return this._currentHealth <= 0
  }

  /** @type {string} */
  get name () {
    return this._monDetails.name
  }

  /** @type {number} */
  get currentLevel () {
    return this._monDetails.currentLevel
  }

  /** @type {import("../../types/typedef.js").Attack[]} */
  get attacks () {
    return [...this._monAttacks]
  }

  /** @type {import("../../types/typedef.js").MonStats} */
  get monStats () {
    return this._monStats
  }

  /** @type {import("../../types/typedef.js").Type[]} */
  get types () {
    return this._baseMonDetails.types
  }

  /**
   * 
   * @param {BattleMon} attacker 
   * @param {import("../../types/typedef.js").Attack} attackMove 
   * @returns {import("../../types/typedef.js").PostAttackResult}
   * 
   */
  receiveAttackAndCalculateDamage (attacker, attackMove) {
    const level = attacker.currentLevel
    const attackerStats = attacker.monStats
    const attkPwr = attackMove.power
    const attackMoveType = MON_TYPES[attackMove.typeKey]

    const effectiveAttack = attackMove.usesMonSplStat ? attackerStats.splAttack : attackerStats.attack
    const effectiveDefense = attackMove.usesMonSplStat ? this._monStats.splDefense : this._monStats.defense
    const stabMod = attacker.types.find(t => attackMoveType.name === t.name) ? 1.5 : 1
    let critMod = 1
    let typeMod = 1
    
    const monTypesFlat = this._baseMonDetails.types.map(type => type.name)

    const wasImmune = !!attackMoveType.immuneTo.find(am => monTypesFlat.indexOf(am) !== -1)
    const wasSuperEffective = !!attackMoveType.superEffectiveAgainst.find(am => monTypesFlat.indexOf(am) !== -1)
    const wasResistant = !!this._baseMonDetails.types.find(mt => mt.resistantAgainst.indexOf(attackMoveType.name) !== -1)
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
      damageTaken: (((2 * level * critMod) / 50 + 2) * (attkPwr / 10) * (effectiveAttack / effectiveDefense)) * stabMod * typeMod,
      wasCriticalHit,
      wasSuperEffective,
      wasImmune,
      wasResistant
    }
    return res
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
   * @param {boolean} noDamageTaken
   * @returns {void}
   */
  playMonTakeDamageAnimation (callback, noDamageTaken) {
    if (this._skipBattleAnimations || noDamageTaken) {
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
    this._healthBar = new HealthBar(this._scene, 72, 42, this._currentHealth, this._maxHealth, { showHpNums: this.#showHpNums })
    this.#createMonsTypeGameObjectContainer()

    this._phaserHealthBarGameContainer = this._scene.add.container(20, 0, [
      this._phaserMonDetailsBackgroundImageGameObject,
      this._monNameGameText,
      this._monLvlGameText,
      this._monHpLabelGameText,
      this._healthBar.container,
      this._typeContainers
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
  
  hideBattleDetails () {
    this._phaserHealthBarGameContainer.setAlpha(0)
  }

  #getMonAttacks () {
    this._monDetails.attackIds.forEach(attkId => {
      const monAttk = DataUtils.getMonAttack(this._scene, attkId)
      if (monAttk !== undefined) {
        this._monAttacks.push(monAttk)
      }
    })
  }

  /**
   * 
   * @param {import("../../types/typedef.js").Coordinate} pos 
   */
  #createMonGameObject (pos) {
    this._phaserMonImageGameObject = this._scene.add.image(pos.x, pos.y, this._battleSpriteAssetKey, this._baseMonDetails.assetFrame).setOrigin(0).setAlpha(0)
  }

  #createMonDetailsGameObject () {
    this._phaserMonDetailsBackgroundImageGameObject = this._scene.add.image(0, 0 , BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND).setOrigin(0)
  }

  #createMonsTypeGameObjectContainer () {
    this._typeContainers = this._scene.add.container(0, 0, [])

    const typeOne = this._baseMonDetails.types[0]
    const typeOneBg = this._scene.add.graphics()
    typeOneBg.fillStyle(typeOne.colour, 1)
    typeOneBg.fillRoundedRect(0, 0, 45, 22, 5)

    this._typeContainers.add(this._scene.add.container(30, 45, [
      typeOneBg,
      this._scene.add.bitmapText(5, 2, 'gb-font-light', typeOne.name.substring(0, 3), 20)
    ]))

    if (this._baseMonDetails.types.length === 2) {
      const typeTwo = this._baseMonDetails.types[1]
      const typeTwoBg = this._scene.add.graphics()
      typeTwoBg.fillStyle(typeTwo.colour, 1)
      typeTwoBg.fillRoundedRect(0, 0, 45, 22, 5)
      this._typeContainers.add(this._scene.add.container(80, 45, [
        typeTwoBg,
        this._scene.add.bitmapText(5, 2, 'gb-font-light', typeTwo.name.substring(0, 3), 20)
      ]))
    }
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
}