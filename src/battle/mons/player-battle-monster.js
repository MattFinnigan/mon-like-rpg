import { BATTLE_ASSET_KEYS } from "../../assets/asset-keys.js";
import { BattleMon } from "./battle-mon.js";

/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 20,
  y: 160
})

export class PlayerBattleMon extends BattleMon {
  /** @type {Phaser.GameObjects.BitmapText} */
  #healthbarTextGameObject

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config 
   */
  constructor (config) {
    super(config, PLAYER_IMAGE_POSITION)

    this._phaserHealthBarGameContainer.setPosition(330, 224)
    this._phaserMonImageGameObject.setPosition(PLAYER_IMAGE_POSITION.x, PLAYER_IMAGE_POSITION.y)
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

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playMonAppearAnimation (callback) {
    const startXPos = -30
    const endXPos = PLAYER_IMAGE_POSITION.x
    this._phaserMonImageGameObject.setPosition(startXPos, PLAYER_IMAGE_POSITION.y)
    this._phaserMonImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setX(endXPos)
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 100,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this._phaserMonImageGameObject,
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
  playMonHealthBarContainerAppearAnimation (callback) {
    this._phaserHealthBarGameContainer.setAlpha(1)
    callback()
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation (callback) {
    const startYPos = PLAYER_IMAGE_POSITION.y
    const endYPos = startYPos + 400

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setY(endYPos)
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 300,
      y: {
        from: startYPos,
        to: endYPos
      },
      targets: this._phaserMonImageGameObject,
      onComplete: () => {
        callback()
      }
    })
  }
}