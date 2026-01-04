import { MON_ASSET_KEYS, MON_GRAY_ASSET_KEYS } from "../../assets/asset-keys.js";
import { BattleMon } from "./battle-mon.js";

/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const ENEMY_IMAGE_POSITION = Object.freeze({
  x: 396,
  y: 5
})

export class EnemyBattleMon extends BattleMon {
  /**
   * 
   * @param {import("../../types/typedef").BattleMonConfig} config 
   */
  constructor (config) {
    super(config, ENEMY_IMAGE_POSITION)
    this._phaserMonImageGameObject.setFlipX(true)
  }

  /**
   * 
   * @param {() => void} callback
   * @param {boolean} [isTrainer=false]
   * @returns {void}
   */
  playMonAppearAnimation (callback, isTrainer) {
    if (!isTrainer) {
      const startXPos = -50
      const endXPos = ENEMY_IMAGE_POSITION.x
      const assetKey = MON_ASSET_KEYS[this._phaserMonImageGameObject.texture.key]
      this._phaserMonImageGameObject.setTexture(MON_GRAY_ASSET_KEYS[assetKey + '_GRAY']).setFlipX(true)

      this._phaserMonImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y).setAlpha(1)

      if (this._skipBattleAnimations) {
        this._phaserMonImageGameObject.setTexture(MON_ASSET_KEYS[assetKey])
        this._phaserMonImageGameObject.setX(endXPos)
        this._phaserHealthBarGameContainer.setAlpha(1)
        callback()
        return
      }

      this._scene.tweens.add({
        delay: 0,
        duration: 1500,
        x: {
          from: startXPos,
          to: endXPos
        },
        targets: this._phaserMonImageGameObject,
        onComplete: () => {
          this._phaserMonImageGameObject.setTexture(MON_ASSET_KEYS[assetKey])
          super.playMonCry(() => {
            this._phaserHealthBarGameContainer.setAlpha(1)
            callback()
          })
        }
      })
    } else {     
      if (this._skipBattleAnimations) {
        this._phaserMonImageGameObject.setAlpha(1)
        this._phaserHealthBarGameContainer.setAlpha(1)
        callback()
        return
      }
  
      const endY = this._phaserMonImageGameObject.y
      const endX = this._phaserMonImageGameObject.x
      const steps = 3

      this._phaserMonImageGameObject.setAlpha(1).setScale(0.1).setX(ENEMY_IMAGE_POSITION.x)
      this._phaserMonImageGameObject.y += (this._phaserMonImageGameObject.height - this._phaserMonImageGameObject.height / 4)
      this._phaserMonImageGameObject.x += this._phaserMonImageGameObject.width / 2
  
      this._scene.tweens.add({
        delay: 0,
        duration: 300,
        scale: 1,
        y: endY,
        x: endX,
        targets: this._phaserMonImageGameObject,
        ease: function (t) {
          return Math.round(t * steps) / steps
        },
        onComplete: () => {
          super.playMonCry(() => {
            this._phaserHealthBarGameContainer.setAlpha(1)
            callback()
          })
        }
      })
    }
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation (callback) {
    const startYPos = ENEMY_IMAGE_POSITION.y
    const endYPos = startYPos + 224

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setY(endYPos)
      callback()
      return
    }
    super.playMonCry(() => {
      this._scene.tweens.add({
        delay: 300,
        duration: 350,
        y: {
          from: startYPos,
          to: endYPos
        },
        targets: this._phaserMonImageGameObject,
        onComplete: () => {
          this._phaserHealthBarGameContainer.setAlpha(0)
          callback()
        }
      })
    })
  }
}