import { SKIP_BATTLE_ANIMATIONS } from "../../config.js"
import { MON_ASSET_KEYS } from "../assets/asset-keys.js"
import { AudioManager } from "../utils/audio-manager.js"
import { getMonStats } from "../utils/battle-utils.js"
import { DataUtils } from "../utils/data-utils.js"

export class MonCore {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected @type {import("../types/typedef").Mon} */
  _monDetails
  /** @protected @type {import("../types/typedef").BaseMon} */
  _baseMonDetails
  /** @protected @type {import("../types/typedef.js").Attack[]} */
  _monAttacks
  /** @protected @type {import("../types/typedef.js").MonStats} */
  _monStats
  /** @protected @type {number} */
  _currentHealth
  /** @protected @type {number} */
  _maxHealth
  /** @protected @type {Phaser.GameObjects.Container} */
  _typeContainers
  /** @type {AudioManager} */
  #audioManager

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../types/typedef").Mon} monDetails 
   */
  constructor (scene, monDetails) {
    this._scene = scene
    this._monDetails = monDetails

    this._baseMonDetails = DataUtils.getBaseMonDetails(this._scene, this._monDetails.baseMonIndex)
    this._monStats = getMonStats(this._baseMonDetails, this._monDetails)

    this._currentHealth = this._monDetails.currentHp
    this._maxHealth = this._monStats.hp
    this._monAttacks = []

    this.#audioManager = this._scene.registry.get('audio')
    this.#createMonsTypeGameObjectContainer()
    this.#getMonAttacks()
  }

  /**
   * @returns {string}
   */
  get name () {
    return this._monDetails.name
  }

  /**
   * @returns {boolean}
   */
  get isWild () {
    return this._monDetails.id === undefined
  }

  /**
   * @returns {number}
   */
  get currentHealth () {
    return this._currentHealth
  }

  /**
   * @returns {number}
   */
  get maxHealth () {
    return this._maxHealth
  }

  /**
   * 
   * @param {number} hp 
   * @param {() => void} callback 
   */
  healHp (hp, callback) {
    throw new Error('healHp is not implemented')
  }

  /**
   * 
   * @param {import("../types/typedef").Item} item
   * @param {(result: {
   *   msg: string,
   *   wasSuccessful: boolean
   * }) => void} callback
   */
  playCatchAttempt (item, callback) {}

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playMonCry (callback) {
    if (SKIP_BATTLE_ANIMATIONS) {
      callback()
      return
    }
    this.#audioManager.playSfx(MON_ASSET_KEYS[this._baseMonDetails.assetKey], () => {
      callback()
    })
  }

  #getMonAttacks () {
    this._monDetails.attackIds.forEach(attkId => {
      const monAttk = DataUtils.getMonAttack(this._scene, attkId)
      if (monAttk !== undefined) {
        this._monAttacks.push(monAttk)
      }
    })
  }

  #createMonsTypeGameObjectContainer () {
    this._typeContainers = this._scene.add.container(0, 0, []).setAlpha(0)

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

}