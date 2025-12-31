import { Character } from "./character.js";
import { DIRECTION } from "../../common/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";

export class NPC extends Character {
  /**
   * @typedef NPCConfigProps
   * @type {object}
   * @property {number} frame
   * @property {string[]} messages
   */
  /**
   * @typedef {Omit<import("./character.js").CharacterConfig, 'idleFrameConfig'> & NPCConfigProps} NPCConfig
   */
  
  /** @type {string[]} */
  #messages

  /** @type {boolean} */
  #isTalkingToPlayer

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
        LEFT: config.frame + 12,
        RIGHT: config.frame + 24,
        UP: config.frame + 36,
        NONE: config.frame
      }
    })

    this.#messages = config.messages
    this.#isTalkingToPlayer = false
  }

  /** @returns {string[]} */
  get messages () {
    return [ ...this.#messages ]
  }

  /** @returns {boolean} */
  get isTalkingToPlayer () {
    return this.#isTalkingToPlayer
  }

  /**
   * @param {boolean} val
   */
  set isTalkingToPlayer (val) {
    this.#isTalkingToPlayer = val
  }

  /**
   * 
   * @param {import("../../common/direction.js").Direction} playerDirection 
   */
  facePlayer (playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
      case DIRECTION.NONE:
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP)
        break
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT)
        break
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN)
        break
      case DIRECTION.RIGHT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT)
        break
      default:
        exhaustiveGuard(playerDirection)
        break
    }
  }
}