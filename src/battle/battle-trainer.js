import { TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../assets/asset-keys.js"
/**
 * @type {import("../types/typedef").Coordinate}
 */
const ENEMY_IMAGE_POSITION = Object.freeze({
  x: 430,
  y: 5
})

export class BattleTrainer {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {string} */
  #assetKey
  /**  @type {Phaser.GameObjects.Image} */
  #phaserTrainerImageGameObject
  /** @type {boolean} */
  #skipBattleAnimations
  /** @type {string} */
  #trainerType
  /** @type {string} */
  #name
  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../types/typedef").Trainer} config 
   */
  constructor(scene, config, skipBattleAnimations) {
    this.#scene = scene
    this.#assetKey = config.assetKey
    this.#trainerType = config.trainerType
    this.#name = config.name
        
    this.#skipBattleAnimations = skipBattleAnimations
    this.#phaserTrainerImageGameObject = this.#scene.add.image(ENEMY_IMAGE_POSITION.x, ENEMY_IMAGE_POSITION.y, TRAINER_GRAY_SPRITES[this.#assetKey + '_GRAY']).setOrigin(0).setAlpha(0)
  }

  get name () {
    return this.#name
  }

  get trainerType () {
    return this.#trainerType
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playTrainerAppearAnimation (callback) {
    const startXPos = -30
    const endXPos = ENEMY_IMAGE_POSITION.x

    this.#phaserTrainerImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    if (this.#skipBattleAnimations) {
      this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
      this.#phaserTrainerImageGameObject.setX(endXPos)
      callback()
      return
    }

    this.#scene.tweens.add({
      delay: 0,
      duration: 1500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserTrainerImageGameObject,
      onComplete: () => {
        this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
        callback()
      }
    })
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playTrainerDisappearAnimation (callback) {
    const startXPos = ENEMY_IMAGE_POSITION.x 
    const endXPos = ENEMY_IMAGE_POSITION.x + 400

    this.#phaserTrainerImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    if (this.#skipBattleAnimations) {
      this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
      this.#phaserTrainerImageGameObject.setX(endXPos)
      callback()
      return
    }

    this.#scene.tweens.add({
      delay: 0,
      duration: 500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserTrainerImageGameObject,
      onComplete: () => {
        this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this.#assetKey])
        callback()
      }
    })
  }
}