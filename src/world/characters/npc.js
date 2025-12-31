import { Character } from "./character.js";
import { DIRECTION } from "../../common/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";

/**
 * @typedef {keyof typeof NPC_MOVEMENT_PATTERN} NpcMovemntPattern
 */

/** @enum {NpcMovemntPattern} */
export const NPC_MOVEMENT_PATTERN = Object.freeze({
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE'
})

/**
 * @typedef NPCPath
 * @type {Object.<number, import("../../types/typedef.js").Coordinate>}
 */

export class NPC extends Character {
  /**
   * @typedef NPCConfigProps
   * @type {object}
   * @property {number} frame
   * @property {string[]} messages
   * @property {NPCPath} npcPath
   * @property {NpcMovemntPattern} movementPattern
   */

  /**
   * @typedef {Omit<import("./character.js").CharacterConfig, 'idleFrameConfig'> & NPCConfigProps} NPCConfig
   */
  
  /** @type {string[]} */
  #messages
  /** @type {boolean} */
  #isTalkingToPlayer
  /** @type {NPCPath} */
  #npcPath
  /** @type {number} */
  #currentPathIndex
  /** @type {NpcMovemntPattern} */
  #movementPattern
  /** @type {number} */
  #lastMovementTime

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
    this.#npcPath = config.npcPath
    this.#currentPathIndex = 0
    this.#movementPattern = config.movementPattern
    this.#lastMovementTime = Phaser.Math.Between(3500, 5000)
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

  /**
   * 
   * @param {DOMHighResTimeStamp} time 
   * @returns {void}
   */
  update (time) {
    if (this._isMoving) {
      return
    }
    if (this.#isTalkingToPlayer) {
      return
    }
    super.update(time)

    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return
    }

    /** @type {import("../../common/direction.js").Direction} */
    let characterDirection = DIRECTION.NONE

    if (time > this.#lastMovementTime) {
      let nextPositionIndex = Math.random() < 0.5 ? this.#currentPathIndex - 1 : this.#currentPathIndex + 1
      if (nextPositionIndex === -1) {
        nextPositionIndex = this.#currentPathIndex + 1
      }

      let nextPosition = this.#npcPath[nextPositionIndex]
      const prevPosition = this.#npcPath[this.#currentPathIndex]
      // check movement didnt happen, assume collision occured or same position was rolled
      if (prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y) {
        nextPosition = this.#npcPath[this.#currentPathIndex]
      } else {
        if (nextPosition === undefined) {
          nextPosition = this.#npcPath[0]
          this.#currentPathIndex = 0
        } else {
          this.#currentPathIndex = nextPositionIndex
        }
      }

      if (nextPosition.y < this._phaserGameObject.y) {
        characterDirection = DIRECTION.UP
      } else if (nextPosition.y > this._phaserGameObject.y) {
        characterDirection = DIRECTION.DOWN
      } else if (nextPosition.x > this._phaserGameObject.x) {
        characterDirection = DIRECTION.RIGHT
      } else if (nextPosition.x < this._phaserGameObject.x) {
        characterDirection = DIRECTION.LEFT
      } else if (nextPosition.y < this._phaserGameObject.y) {
        characterDirection = DIRECTION.UP
      } else if (nextPosition.y > this._phaserGameObject.y) {
        characterDirection = DIRECTION.DOWN
      }
      
      this.moveCharacter(characterDirection)
      this.#lastMovementTime = time + Phaser.Math.Between(1000, 3000)
    }
  }

  /**
   * 
   * @param {import("../../common/direction.js").Direction} direction
   * @return {void}
   */
  moveCharacter (direction) {
    super.moveCharacter(direction)
    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim?.key !== `NPC_2_${this._direction}`) {
          this._phaserGameObject.play(`NPC_2_${this._direction}`)
        }
      break
      case DIRECTION.NONE:
        break
      default:
        exhaustiveGuard(this._direction)
    }
  }
}