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
   * @returns {void}
   */
  playMonAppearAnimation (callback) {
    const startXPos = -30
    const endXPos = ENEMY_IMAGE_POSITION.x
    this._phaserMonImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this._phaserMonImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setX(endXPos)
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 1000,
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
    const startYPos = ENEMY_IMAGE_POSITION.y
    const endYPos = startYPos + 224

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setY(endYPos)
      callback()
      return
    }
    super.playMonCry(() => {
      this._scene.tweens.add({
        delay: 0,
        duration: 350,
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