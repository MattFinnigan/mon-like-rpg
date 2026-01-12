import Phaser from "../../lib/phaser.js"
import { HealthBar } from "../../common/health-bar.js" 
import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS } from "../../assets/asset-keys.js"
import { AudioManager } from "../../utils/audio-manager.js"
import { MON_TYPES } from "../../types/mon-types.js"
import { MonCore } from "../../common/mon-core.js"

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
  #showHpNums

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config
   * @param {import("../../types/typedef.js").Coordinate} pos
   * @param {boolean} [showHpNums=false]
    */
  constructor (config, pos = { x: 0, y: 0 }, showHpNums) {
    super(config.scene, config.monDetails)
    this._scene = config.scene
    this._skipBattleAnimations = config.skipBattleAnimations
    this._battleSpriteAssetKey = this._baseMonDetails.assetKey
    this.#showHpNums = showHpNums

    this.#createMonGameObject(pos)
    this.#createMonDetailsGameObject()
    this.#createHealthBarComponents()

  
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
    this._typeContainers.setAlpha(1)

    this._phaserHealthBarGameContainer = this._scene.add.container(20, 0, [
      this._phaserMonDetailsBackgroundImageGameObject,
      this._monNameGameText,
      this._monLvlGameText,
      this._monHpLabelGameText,
      this._healthBar.container,
      this._typeContainers
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
    this._phaserMonDetailsBackgroundImageGameObject = this._scene.add.image(0, 0 , BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND).setOrigin(0)
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