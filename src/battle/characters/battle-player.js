import { TRAINER_SPRITES } from "../../assets/asset-keys.js"
import { BattleMon } from "../mons/battle-mon.js"
import { BattleCharacter } from "./battle-character.js"
/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 160,
  y: 300
})

export class BattlePlayer extends BattleCharacter {
  /**  @type {Phaser.GameObjects.Image} */
  #phaserPlayerImageGameObject
  /** @type {boolean} */
  #characterSpriteShowing

  /**
   * 
   * @param {Phaser.Scene} scene
   * @param {import("../../types/typedef.js").PlayerData} player
   * @param {BattleMon[]} battleMons
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} [config.skipBattleAnimations]
   */
  constructor (scene, player, battleMons, config) {
    super(scene, player, battleMons, {
      ...config,
      remainingMonsPos: { x: 340, y: 250 }
    })
    this._skipBattleAnimations = config.skipBattleAnimations
    this.#characterSpriteShowing = false
    this.#createTrainerGameObject()
  }

  /**
   * @returns {boolean}
   */
  get characterSpriteShowing () {
    return this.#characterSpriteShowing
  }

  /**
   * 
   * @param {() => void} [callback]
   * @returns {void}
   */
  playCharacterAppearAnimation (callback) {
    if (this.#characterSpriteShowing) {
      callback()
      return
    }
    this.#characterSpriteShowing = true
    const startXPos = PLAYER_IMAGE_POSITION.x + 400
    const endXPos = PLAYER_IMAGE_POSITION.x
    this.#phaserPlayerImageGameObject.setPosition(startXPos, PLAYER_IMAGE_POSITION.y)
    this.#phaserPlayerImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this.#phaserPlayerImageGameObject.setX(endXPos)
      this.showRemainingMons()
      if (callback) {
        callback()
      }
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 1500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserPlayerImageGameObject,
      onComplete: () => {
        this.showRemainingMons()
        if (callback) {
          callback()
        }
      }
    })
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playCharacterDisappearAnimation (callback) {
    if (!this.#characterSpriteShowing) {
      callback()
      return
    }
    this.#characterSpriteShowing = false
    const startXPos = PLAYER_IMAGE_POSITION.x
    const endXPos = -250

    this.#phaserPlayerImageGameObject.setPosition(startXPos, PLAYER_IMAGE_POSITION.y)
    this.#phaserPlayerImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this.#phaserPlayerImageGameObject.setX(endXPos)
      this.hideRemainingMons()
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 400,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserPlayerImageGameObject,
      onComplete: () => {
        this.hideRemainingMons()
        callback()
      }
    })
  }

  showTrainer () {
    this.#characterSpriteShowing = true
    this.#phaserPlayerImageGameObject.setAlpha(1)
    this.#phaserPlayerImageGameObject.setPosition(-250, PLAYER_IMAGE_POSITION.y)

    this._scene.tweens.add({
      delay: 0,
      duration: 400,
      x: {
        from: -250,
        to: PLAYER_IMAGE_POSITION.x
      },
      targets: this.#phaserPlayerImageGameObject
    })
  }

  #createTrainerGameObject () {
    this.#phaserPlayerImageGameObject = this._scene.add.image(0, 0, TRAINER_SPRITES[this._assetKey]).setAlpha(0).setScale(1.25)
    this._phaserMonDetailsBackgroundImageGameObject.setFlipX(true)
  }
}