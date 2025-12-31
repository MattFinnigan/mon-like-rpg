import { Character } from "./character.js";
import { DIRECTION } from "../../common/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";

export class NPC extends Character {

/**
 * @typedef {Omit<import("./character.js").CharacterConfig, 'idleFrameConfig'> & {frame: number}} NPCConfig
 * 
 */

  /**
   * 
   * @param {NPCConfig} config 
   */
  constructor (config) {
    super({
      ...config,
      origin: { x: 0.15, y: 0.5 },
      idleFrameConfig: {
        DOWN: config.frame,
        LEFT: config.frame + config.frame,
        RIGHT: config.frame + (config.frame * 2),
        UP: config.frame + (config.frame * 3),
        NONE: 1
      }
    })
  }

  /**
   * 
   * @param {import("../../common/direction.js").Direction} playerDirection 
   */
  facePlayer (playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
      case DIRECTION.NONE:
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP).setFlipX(false)
        break
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT).setFlipX(false)
        break
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT).setFlipX(true)
        break
      case DIRECTION.RIGHT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN)
        break
      default:
        exhaustiveGuard(playerDirection)
        break
    }
  }
}