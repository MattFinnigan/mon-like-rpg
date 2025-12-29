import { TILE_SIZE } from "../../../config.js"
import { DIRECTION } from "../../common/direction.js"
import Phaser from "../../lib/phaser.js"
import { exhaustiveGuard } from "../../utils/guard.js"

/**
 * @typedef CharacterConfig
 * @type {object}
 * @property {Phaser.Scene} scene
 * @property {string} assetKey
 * @property {number} [assetFrame=0]
 * @property {import("../../types/typedef").Coordinate} position
 */

export class Character {
  /** @type {Phaser.Scene} */
  _scene
  /** @type {Phaser.GameObjects.Sprite} */
  _phaserGameObject

  /**
   * 
   * @param {CharacterConfig} config 
   */
  constructor (config) {
    this._scene = config.scene
    this._phaserGameObject = this._scene.add.sprite(config.position.x, config.position.y, config.assetKey, config.assetFrame || 0).setOrigin(0)
  }

  /**
   * 
   * @param {import("../../common/direction.js").Direction} direction 
   */
  moveCharacter (direction) {
    switch (direction) {
      case DIRECTION.DOWN:
        this._phaserGameObject.y += TILE_SIZE
        break
      case DIRECTION.UP:
        this._phaserGameObject.y -= TILE_SIZE
        break
      case DIRECTION.LEFT:
        this._phaserGameObject.x -= TILE_SIZE
        break
      case DIRECTION.RIGHT:
        this._phaserGameObject.x += TILE_SIZE
        break
      case DIRECTION.NONE:
        break
      default:
        exhaustiveGuard(direction)
    }
  }
}