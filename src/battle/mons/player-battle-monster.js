import { BATTLE_ASSET_KEYS, MON_BACK_ASSET_KEYS } from "../../assets/asset-keys.js";
import { BattleMon } from "./battle-mon.js";

/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 20,
  y: 160
})

export class PlayerBattleMon extends BattleMon {
  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config 
   */
  constructor (config) {
    super(config, PLAYER_IMAGE_POSITION, true)

    this._phaserHealthBarGameContainer.setPosition(330, 224)
    this._phaserMonImageGameObject.setPosition(PLAYER_IMAGE_POSITION.x, PLAYER_IMAGE_POSITION.y)
    this._phaserMonDetailsBackgroundImageGameObject.setTexture(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND)
    this._monNameGameText.setPosition(30, 2)
    this._monLvlGameText.setPosition(150, 44)
    this._monHpLabelGameText.setPosition(35, 76)
    this._healthBar.container.setPosition(82, 42)

    const assetKey = this._phaserMonImageGameObject.texture.key
    this._phaserMonImageGameObject.setTexture(MON_BACK_ASSET_KEYS[assetKey + '_BACK'])
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
        super.playMonCry(() => {
          callback()
        })
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
    super.playMonCry(() => {
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
    })
  }
}