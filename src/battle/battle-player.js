import { TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../assets/asset-keys.js"
/**
 * @type {import("../types/typedef").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 40,
  y: 190
})

export class BattlePlayer {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {string} */
  #assetKey
  /**  @type {Phaser.GameObjects.Image} */
  #phaserPlayerImageGameObject
  /** @type {boolean} */
  #skipBattleAnimations

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} config.skipBattleAnimations 
   */
  constructor (scene, config) {
    this.#scene = scene
    this.#assetKey = config.assetKey
    this.#skipBattleAnimations = config.skipBattleAnimations
    this.#phaserPlayerImageGameObject = this.#scene.add.image(0, 0, TRAINER_GRAY_SPRITES[this.#assetKey + '_GRAY']).setOrigin(0).setAlpha(0).setScale(2.25)
  }

  /**
   * 
   * @param {() => void} [callback]
   * @returns {void}
   */
  playPlayerAppearAnimation (callback) {
    const startXPos = PLAYER_IMAGE_POSITION.x + 400
    const endXPos = PLAYER_IMAGE_POSITION.x
    this.#phaserPlayerImageGameObject.setPosition(startXPos, PLAYER_IMAGE_POSITION.y)
    this.#phaserPlayerImageGameObject.setAlpha(1)

    if (this.#skipBattleAnimations) {
      this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
      this.#phaserPlayerImageGameObject.setX(endXPos)
      if (callback) {
        callback()
      }
      return
    }

    this.#scene.tweens.add({
      delay: 0,
      duration: 1500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserPlayerImageGameObject,
      onComplete: () => {
        this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
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
  playTrainerDisappearAnimation (callback) {
    const startXPos = PLAYER_IMAGE_POSITION.x
    const endXPos = -250

    this.#phaserPlayerImageGameObject.setPosition(startXPos, PLAYER_IMAGE_POSITION.y)
    this.#phaserPlayerImageGameObject.setAlpha(1)

    if (this.#skipBattleAnimations) {
      this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
      this.#phaserPlayerImageGameObject.setX(endXPos)
      callback()
      return
    }

    this.#scene.tweens.add({
      delay: 0,
      duration: 400,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserPlayerImageGameObject,
      onComplete: () => {
        this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
        callback()
      }
    })
  }
}