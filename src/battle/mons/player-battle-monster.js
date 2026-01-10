import { BATTLE_ASSET_KEYS, MON_BACK_ASSET_KEYS, MON_BALLS } from "../../assets/asset-keys.js";
import { createExpandBallAnimation } from "../../utils/animations.js";
import { BattleMon } from "./battle-mon.js";

/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const PLAYER_IMAGE_POSITION = Object.freeze({
  x: 20,
  y: 160
})

export class PlayerBattleMon extends BattleMon {
  /** @type {Phaser.GameObjects.Sprite} */
  #monBallExpandSpriteAnimation

  /**
   * 
   * @param {import("../../types/typedef.js").BattleMonConfig} config 
   */
  constructor (config) {
    super(config, PLAYER_IMAGE_POSITION, true)

    this._phaserHealthBarGameContainer.setPosition(330, 224)
    this._monNameGameText.setPosition(30, 2)
    this._monLvlGameText.setPosition(150, 44)
    this._monHpLabelGameText.setPosition(35, 76)
    this._healthBar.container.setPosition(82, 42)

    this.#createMonGameObject()
    this.#createMonDetailsGameObject()
    this.#monBallExpandSpriteAnimation = null
  }
  
  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playMonAppearAnimation (callback) {
    this._phaserHealthBarGameContainer.setAlpha(0)
    this._phaserMonImageGameObject.setAlpha(0)

    if (this._skipBattleAnimations) {
      this._phaserHealthBarGameContainer.setAlpha(1)
      this._phaserMonImageGameObject.setAlpha(1)
      callback()
      return
    }

    const coords = {
      x: PLAYER_IMAGE_POSITION.x + (this._phaserMonImageGameObject.width / 2) + 10,
      y: PLAYER_IMAGE_POSITION.y + (this._phaserMonImageGameObject.height / 2) + 10,
    }

    if (!this.#monBallExpandSpriteAnimation) {
      this.#monBallExpandSpriteAnimation = createExpandBallAnimation(this._scene, coords).setScale(1.5)
    }

    this.#monBallExpandSpriteAnimation.play(MON_BALLS.MON_BALL_EXPAND_ANIMATION)
    this.#monBallExpandSpriteAnimation.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.#monBallExpandSpriteAnimation.setAlpha(0)
      this._scene.time.delayedCall(300, () => {
        this._phaserMonImageGameObject.setAlpha(1)
        super.playMonCry(() => {
          this._phaserHealthBarGameContainer.setAlpha(1)
          callback()
        })
      })
    })

  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation (callback) {
    const startYPos = PLAYER_IMAGE_POSITION.y
    const endYPos = startYPos + 400

    this._phaserMonImageGameObject.setDepth(-1)

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setY(endYPos)
      callback()
      return
    }
    super.playMonCry(() => {
      this._scene.tweens.add({
        delay: 300,
        duration: 300,
        y: {
          from: startYPos,
          to: endYPos
        },
        targets: this._phaserMonImageGameObject,
        onComplete: () => {
          this._phaserHealthBarGameContainer.setAlpha(0)
          callback()
        }
      })
    })
  }

  #createMonGameObject () {
    this._phaserMonImageGameObject.setPosition(PLAYER_IMAGE_POSITION.x, PLAYER_IMAGE_POSITION.y)
    const assetKey = this._phaserMonImageGameObject.texture.key
    this._phaserMonImageGameObject.setTexture(MON_BACK_ASSET_KEYS[assetKey + '_BACK'])
  }

  #createMonDetailsGameObject () {
    this._phaserMonDetailsBackgroundImageGameObject.setTexture(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND)
  }
}