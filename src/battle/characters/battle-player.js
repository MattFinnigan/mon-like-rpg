import { TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../../assets/asset-keys.js"
import { BattleCharacter } from "./battle-character.js"
/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 40,
  y: 190
})

export class BattlePlayer extends BattleCharacter {
  /**  @type {Phaser.GameObjects.Image} */
  #phaserPlayerImageGameObject
  /** @type {boolean} */
  #characterSpriteShowing

  /**
   * 
   * @param {Phaser.Scene} scene
   * @param {import("../../types/typedef.js").Player} player
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} [config.skipBattleAnimations ]
   */
  constructor (scene, player, config) {
    super(scene, player, {
      ...config,
      remainingMonsPos: { x: 340, y: 250 }
    })
    this._skipBattleAnimations = config.skipBattleAnimations
    this.#phaserPlayerImageGameObject = this._scene.add.image(0, 0, TRAINER_GRAY_SPRITES[this._assetKey + '_GRAY']).setOrigin(0).setAlpha(0).setScale(2.25)
    this._phaserMonDetailsBackgroundImageGameObject.setFlipX(true)
    this.#characterSpriteShowing = false
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
      this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
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
        this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
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
      this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
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
        this.#phaserPlayerImageGameObject.setTexture(TRAINER_SPRITES[this._assetKey])
        callback()
      }
    })
  }

  showTrainer () {
    this.#characterSpriteShowing = true
    this.#phaserPlayerImageGameObject.setPosition(PLAYER_IMAGE_POSITION.x, PLAYER_IMAGE_POSITION.y)
    this.#phaserPlayerImageGameObject.setAlpha(1)
  }
}