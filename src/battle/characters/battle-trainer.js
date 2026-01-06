import { TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../../assets/asset-keys.js"
import { BattleCharacter } from "./battle-character.js"
/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const ENEMY_IMAGE_POSITION = Object.freeze({
  x: 430,
  y: 5
})

export class BattleTrainer extends BattleCharacter {
  /**  @type {Phaser.GameObjects.Image} */
  #phaserTrainerImageGameObject
  /** @type {string} */
  #trainerType
  /** @type {string} */
  #name
  /** @type {boolean} */
  #characterSpriteShowing
  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {import("../../types/typedef.js").Trainer} trainer
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} [config.skipBattleAnimations]
   */
  constructor(scene, trainer, config) {
    super(scene, trainer, config)
    this.#trainerType = trainer.trainerType
    this.#name = trainer.name
    this.#phaserTrainerImageGameObject = this._scene.add.image(ENEMY_IMAGE_POSITION.x, ENEMY_IMAGE_POSITION.y, TRAINER_GRAY_SPRITES[this._assetKey + '_GRAY']).setOrigin(0).setAlpha(0)
    this.#characterSpriteShowing = false
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
  playCharacterAppearAnimation (callback) {
    if (this.#characterSpriteShowing) {
      callback()
      return
    }
    this.#characterSpriteShowing = true
    const startXPos = -30
    const endXPos = ENEMY_IMAGE_POSITION.x

    this.#phaserTrainerImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
      this.#phaserTrainerImageGameObject.setX(endXPos)
      this.showRemainingMons()
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 1500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserTrainerImageGameObject,
      onComplete: () => {
        this.showRemainingMons()
        this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
        callback()
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
    const startXPos = ENEMY_IMAGE_POSITION.x 
    const endXPos = ENEMY_IMAGE_POSITION.x + 400

    this.#phaserTrainerImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
      this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
      this.#phaserTrainerImageGameObject.setX(endXPos)
      this.hideRemainingMons()
      callback()
      return
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 500,
      x: {
        from: startXPos,
        to: endXPos
      },
      targets: this.#phaserTrainerImageGameObject,
      onComplete: () => {
        this.hideRemainingMons()
        this.#phaserTrainerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
        callback()
      }
    })
  }

  showTrainer () {
    this.#characterSpriteShowing = true
    this.#phaserTrainerImageGameObject.setPosition(ENEMY_IMAGE_POSITION.x, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)
  }
}