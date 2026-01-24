import { Character } from "./character.js";
import { DIRECTION } from "../../types/direction.js";
import { exhaustiveGuard } from "../../utils/guard.js";
import { SCENE_KEYS } from "../../scenes/scene-keys.js";
import { OPPONENT_TYPES } from "../../types/opponent-types.js";
import { DataUtils } from "../../utils/data-utils.js";
import { EVENT_KEYS } from "../../types/event-keys.js";

/**
 * @typedef {keyof typeof NPC_ACTION_TYPES} NPCAction
 */

/** @enum {NPCAction} */
const NPC_ACTION_TYPES = Object.freeze({
  NONE: 'NONE',
  TRADE: 'TRADE',
  ITEM: 'ITEM',
  HEAL: 'HEAL',
  BATTLE: 'BATTLE'
})

/**
 * @typedef {keyof typeof NPC_MOVEMENT_PATTERN} NpcMovemntPattern
 */

/** @enum {NpcMovemntPattern} */
export const NPC_MOVEMENT_PATTERN = Object.freeze({
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE',
  LEFT_RIGHT: 'LEFT_RIGHT',
  UP_DOWN: 'UP_DOWN'
})

/**
 * @typedef NPCPath
 * @type {Object.<number, import("../../types/typedef.js").Coordinate>}
 */

/**
 * @typedef NPCConfigProps
 * @type {object}
 * @property {string} name
 * @property {number} frame
 * @property {string[]} messages
 * @property {NPCPath} npcPath
 * @property {NpcMovemntPattern} movementPattern
 * @property {NPCAction} action
 * @property {number|undefined} [actionId]
 */

/**
 * @typedef {Omit<import("./character.js").CharacterConfig, 'idleFrameConfig'> & NPCConfigProps} NPCConfig
 */

export class NPC extends Character {
  /** @type {Phaser.Scene} */
  #scene
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
  /** @type {NPCAction} */
  #action
  /** @type {number|undefined} */
  #actionId
  /** @type {boolean} */
  #actionPending
  /** @type {string} */
  #name
  
  /**
   * 
   * @param {NPCConfig} config 
   */
  constructor (scene, config) {
    super({
      ...config,
      origin: { x: 0.15, y: 0.45 },
      idleFrameConfig: {
        DOWN: config.frame,
        LEFT: config.frame + 12,
        RIGHT: config.frame + 24,
        UP: config.frame + 36,
        NONE: config.frame
      }
    })

    this.#scene = scene
    this.#messages = config.messages
    this.#isTalkingToPlayer = false
    this.#npcPath = config.npcPath
    this.#currentPathIndex = 0
    this.#movementPattern = config.movementPattern
    this.#lastMovementTime = this.#getMovementRate()
    this.#name = config.name
    
    this.#action = config.action
    this.#actionId = config.actionId
    this.#actionPending = false
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
   * @returns {boolean}
   */
  get actionPending () {
    return this.#actionPending
  }

  /**
   * 
   * @param {import("../../types/direction.js").Direction} playerDirection 
   */
  facePlayer (playerDirection) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
      case DIRECTION.NONE:
        this._direction = DIRECTION.UP
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP)
        break
      case DIRECTION.LEFT:
        this._direction = DIRECTION.RIGHT
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT)
        break
      case DIRECTION.UP:
        this._direction = DIRECTION.DOWN
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN)
        break
      case DIRECTION.RIGHT:
        this._direction = DIRECTION.LEFT
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
    if (this._isMoving || this.#actionPending) {
      return
    }
    if (this.#isTalkingToPlayer) {
      if (!this.#actionPending && this.#action !== NPC_ACTION_TYPES.NONE) {
        this.#actionPending = true
      }
      return
    }

    super.update(time)

    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return
    }

    /** @type {import("../../types/direction.js").Direction} */
    let characterDirection = DIRECTION.NONE

    if (time > this.#lastMovementTime) {
      let nextPositionIndex = this.#currentPathIndex

      switch (this.#movementPattern) {
        case NPC_MOVEMENT_PATTERN.CLOCKWISE:
          nextPositionIndex = Math.random() < 0.5 ? this.#currentPathIndex - 1 : this.#currentPathIndex + 1
          break
        case NPC_MOVEMENT_PATTERN.UP_DOWN:
        case NPC_MOVEMENT_PATTERN.LEFT_RIGHT:
          nextPositionIndex = this.#currentPathIndex + 1
          break
        default:
          exhaustiveGuard(this.#movementPattern)
          break
      }

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
      this.#lastMovementTime = time + this.#getMovementRate()
    }
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
        if (!this._phaserGameObject.anims.isPlaying || this._phaserGameObject.anims.currentAnim?.key !== `${this.#name}_${this._direction}`) {
          this._phaserGameObject.play(`${this.#name}_${this._direction}`)
        }
      break
      case DIRECTION.NONE:
        break
      default:
        exhaustiveGuard(this._direction)
    }
  }

  doAction () {
    switch (this.#action) {
      case NPC_ACTION_TYPES.BATTLE:
        this.#scene.events.emit(EVENT_KEYS.TRAINER_BATTLE_START, {
          npc: this,
          actionId: this.#actionId,
          onTransitionComplete: () => {
            this.#actionPending = false
          } })
        break
      case NPC_ACTION_TYPES.HEAL:
      case NPC_ACTION_TYPES.ITEM:
      case NPC_ACTION_TYPES.TRADE:
      case NPC_ACTION_TYPES.NONE:
        this.#actionPending = false
        break
      default:
        exhaustiveGuard(this.#action)
    }
  }

  /**
   * 
   * @returns {number}
   */
  #getMovementRate () {
    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return 0
    }

    switch (this.#movementPattern) {
      case NPC_MOVEMENT_PATTERN.CLOCKWISE:
        return Phaser.Math.Between(1000, 3000)
      case NPC_MOVEMENT_PATTERN.LEFT_RIGHT:
      case NPC_MOVEMENT_PATTERN.UP_DOWN:
        return 300
      default:
        exhaustiveGuard(this.#movementPattern)
        break
    } 
    // return Phaser.Math.Between(3500, 5000)
  }
}