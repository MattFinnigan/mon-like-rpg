import { TRAINER_SPRITES } from "../../assets/asset-keys.js"
import { BattleMon } from "../mons/battle-mon.js"
import { BattleCharacter } from "./battle-character.js"
/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const ENEMY_IMAGE_POSITION = Object.freeze({
  x: 490,
  y: 120
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
   * @param {BattleMon[]} battleMons
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} [config.skipBattleAnimations]
   */
  constructor(scene, trainer, battleMons, config) {
    super(scene, trainer, battleMons, config)
    this.#trainerType = trainer.trainerType
    this.#name = trainer.name
    this.#characterSpriteShowing = false
    this.#createTrainerGameObject()
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
    // TODO resize gray/normal sprites to match
    this.#phaserTrainerImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    if (this._skipBattleAnimations) {
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
        this.#phaserTrainerImageGameObject.setPosition(ENEMY_IMAGE_POSITION.x, ENEMY_IMAGE_POSITION.y)
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
        callback()
      }
    })
  }

  showTrainer () {
    this.#characterSpriteShowing = true
    this.#phaserTrainerImageGameObject.setPosition(ENEMY_IMAGE_POSITION.x + 400, ENEMY_IMAGE_POSITION.y)
    this.#phaserTrainerImageGameObject.setAlpha(1)

    this._scene.tweens.add({
      delay: 0,
      duration: 500,
      x: {
        from: ENEMY_IMAGE_POSITION.x + 400,
        to: ENEMY_IMAGE_POSITION.x
      },
      targets: this.#phaserTrainerImageGameObject
    })
  }

  #createTrainerGameObject () {
    this.#phaserTrainerImageGameObject = this._scene.add.image(ENEMY_IMAGE_POSITION.x, ENEMY_IMAGE_POSITION.y, TRAINER_SPRITES[this._assetKey]).setAlpha(0)
  }
}