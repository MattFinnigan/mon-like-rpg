import { BATTLE_ASSET_KEYS } from "../../assets/asset-keys.js";
import { BattleMon } from "./battle-mon.js";


export class PlayerBattleMon extends BattleMon {
  /** @type {Phaser.GameObjects.BitmapText} */
  #healthbarTextGameObject

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config 
   */
  constructor (config) {
    super(config)

    this._phaserHealthBarGameContainer.setPosition(330, 224)
    this._phaserMonImageGameObject.setPosition(20, 160)
    this._phaserMonDetailsBackgroundImageGameObject.setTexture(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND)
    this._monNameGameText.setPosition(30, 2)
    this._monLvlGameText.setPosition(150, 44)
    this._monHpLabelGameText.setPosition(35, 76)
    this._healthBar.container.setPosition(82, 42)

    this.#addHealthBarComponents()
  }

  #setHealthBarText () {
    this.#healthbarTextGameObject.setText(`${this._currentHealth} / ${this._maxHealth}`)
  }

  #addHealthBarComponents () {
    this.#healthbarTextGameObject = this._scene.add.bitmapText(90, 100, 'gb-font-thick', `${this._currentHealth} / ${this._maxHealth}`, 30)
    this._phaserHealthBarGameContainer.add(this.#healthbarTextGameObject)
  }

  /**
   * 
   * @param {number} damage 
   * @param {() => void} [callback] 
   */
  takeDamage (damage, callback) {
    super.takeDamage(damage, callback)
    this.#setHealthBarText()
  }
}