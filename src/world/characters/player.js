import { CHARACTER_ASSET_KEYS } from "../../assets/asset-keys.js";
import { DIRECTION } from "../../types/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";
import { Character } from "./character.js";

/**
 * @typedef {Omit<import("./character.js").CharacterConfig, 'assetKey' | 'idleFrameConfig'>} PlayerConfig
 * 
 */

export class Player extends Character {
  /**
   * 
   * @param {PlayerConfig} config 
   */
  constructor (config) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.SHEET_1,
      origin: { x: 0.15, y: 0.45 },
      idleFrameConfig: {
        DOWN: 1,
        LEFT: 13,
        RIGHT: 24,
        UP: 37,
        NONE: 1,
      }
    })
  }
  
  /**
   * 
   * @param {import("../../types/direction.js").Direction} direction
   * @return {void}
   */
  moveCharacter (direction) {
    super.moveCharacter(direction)
    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim?.key !== `PLAYER_${this._direction}`) {
          this._phaserGameObject.play(`PLAYER_${this._direction}`)
        }
      break
      case DIRECTION.NONE:
        break
      default:
        exhaustiveGuard(this._direction)
    }
  }
}