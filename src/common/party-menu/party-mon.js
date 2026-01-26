import { CHARACTER_ASSET_KEYS } from "../../assets/asset-keys.js"
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../../utils/data-manager.js"
import { HealthBar } from "../health-bar.js"
import { MonCore } from "../mon-core.js"

export class PartyMon extends MonCore {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {HealthBar} */
  #healthBar
  /** @type {Phaser.GameObjects.BitmapText} */
  #phaserHpTextGameObject
  /** @type {Phaser.GameObjects.BitmapText} */
  #phaserLvlTextGameObject

  constructor (scene, mon) {
    super(scene, mon)
    this.#scene = scene
    
    this.#createPartyMonGameObject()
  }

  /**
   * @returns {Phaser.GameObjects.Container}
   */
  get container () {
    return this.#container
  }

  /** @returns {number} */
  get id () {
    return this._monDetails.id
  }

  #createPartyMonGameObject () {
    this.#healthBar = new HealthBar(this.#scene, 117, 23, this._monDetails.currentHp , this._monStats.hp, { monId: this._monDetails.id, scale: 1 })
    this.#phaserHpTextGameObject = this.#scene.add.bitmapText(380, 35, 'gb-font-thick', `${this._monDetails.currentHp} / ${this._monStats.hp}`, 30).setOrigin(0)
    this.#phaserLvlTextGameObject = this.#scene.add.bitmapText(350, 10, 'gb-font-thick', `Lv${this._monDetails.currentLevel}`, 30).setOrigin(0)

    this.#container = this.#scene.add.container(50, 0, [
      this.#scene.add.image(25, 5, CHARACTER_ASSET_KEYS.SHEET_16, this._baseMonDetails.partySpriteAssetKey)
        .setScale(1.25),
      this.#scene.add.bitmapText(65, 0, 'gb-font', this._monDetails.name, 40).setOrigin(0),
      this.#scene.add.bitmapText(75, 40, 'gb-font-thick', `HP:`, 20).setOrigin(0),
      this.#healthBar.container,
      this.#phaserHpTextGameObject,
      this.#phaserLvlTextGameObject
    ]).setAlpha(0)
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
    this.#healthBar.setMeterPercentageAnimated(this._currentHealth, this._currentHealth / this._maxHealth, { callback })
    this.#phaserHpTextGameObject.setText(`${this._currentHealth} / ${this._maxHealth}`)
    this.#updateHp()
  }

  #updateHp () {
    const withUpdatedMonHp = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS).map(mon => {
      if (mon.id === this._monDetails.id) {
        mon.currentHp = this._currentHealth
      }
      return mon
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, withUpdatedMonHp)
    dataManager.saveData()
  }
}