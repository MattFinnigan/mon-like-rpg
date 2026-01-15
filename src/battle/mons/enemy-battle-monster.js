import { SKIP_ANIMATIONS } from "../../../config.js";
import { MON_ASSET_KEYS, MON_BALLS, MON_GRAY_ASSET_KEYS } from "../../assets/asset-keys.js";
import { createBallWiggleAnimation, createExpandBallAnimation } from "../../utils/animations.js";
import { BattleMon } from "./battle-mon.js";

/**
 * @type {import("../../types/typedef.js").Coordinate}
 */
const ENEMY_IMAGE_POSITION = Object.freeze({
  x: 396,
  y: 5
})

export class EnemyBattleMon extends BattleMon {
  /** @type {Phaser.GameObjects.Sprite} */
  #monBallWiggleSpriteAnimation
  /** @type {Phaser.GameObjects.Sprite} */
  #monBallExpandSpriteAnimation

  /**
   * 
   * @param {import("../../types/typedef").BattleMonConfig} config 
   */
  constructor (config) {
    super(config, ENEMY_IMAGE_POSITION)
    this._phaserMonImageGameObject.setFlipX(true)
    this.#monBallWiggleSpriteAnimation = createBallWiggleAnimation(this._scene, { x: 0, y: 0 }).setScale(1.25)
    this.#monBallExpandSpriteAnimation = createExpandBallAnimation(this._scene, { x: 0, y: 0}).setScale(1.5).setAlpha(0)
    this.#monBallWiggleSpriteAnimation.setAlpha(0)
  }

  /**
   * @returns {import("../../types/typedef.js").Mon}
   */
  get monDetails () {
    return this._monDetails
  }

  /**
   * 
   * @param {() => void} callback
   * @param {boolean} [isTrainer=false]
   * @returns {void}
   */
  playMonAppearAnimation (callback, isTrainer) {
    if (isTrainer) {
      this.#playTrainerMonAppearAnimation(callback)
      return
    }
    this.#playWildMonAppearAnimation(callback)
  }

  /**
   * 
   * @param {import("../../types/typedef.js").Item} item
   * @param {(result: {
   *   msg: string,
   *   wasSuccessful: boolean
   * }) => void} callback
   */
  playCatchAttempt (item, callback) {
    let successRolls = 0
    // todo increase/decrease changes based on ball
    for (let i = 0; i < 3; i++) {
      const roll = Phaser.Math.Between(0, 10)
      if (roll < 8) {
        successRolls++
      }
    }

    const playBallExplode = (onComplete) => {
      this.#monBallExpandSpriteAnimation.setAlpha(1)
      this.#monBallExpandSpriteAnimation.play(MON_BALLS.MON_BALL_EXPAND_ANIMATION)
      this.#monBallExpandSpriteAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.#monBallExpandSpriteAnimation.setAlpha(0)
        onComplete()
      })
    }

    const playFailedBallExplode = (finishUpCallback) => {
      if (SKIP_ANIMATIONS) {
        finishUpCallback()
        return
      }
      this.#monBallWiggleSpriteAnimation.setAlpha(0)
      playBallExplode(() => {
        this._scene.time.delayedCall(100, () => {
          this._phaserMonImageGameObject.setAlpha(1)
          finishUpCallback()
        })
      })
    }

    const sendResult = () => {
      if (successRolls >= 3) {
        this.#monBallWiggleSpriteAnimation.setTexture(MON_BALLS.MON_BALLS_SHEET_1, 9)
        callback({
          msg: `Wild ${this._baseMonDetails.name} was caught!`,
          wasSuccessful: true
        })
        return
      }
      playFailedBallExplode(() => {
        let msg = 'It broke free easily!'
        if (successRolls === 1) {
          msg = 'Gosh darn it!'
        }
        if (successRolls === 2) {
          msg = 'Argh! So close!'
        }
        callback({
          msg: msg,
          wasSuccessful: false
        })
      })

    }

    if (SKIP_ANIMATIONS) {
      sendResult()
      return
    }
  
    const startPos = { x: 224, y: 300 }
    const endPos = { 
      x: ENEMY_IMAGE_POSITION.x + 112, 
      y: ENEMY_IMAGE_POSITION.y + 180 
    }

    const controlPoint = {
      x: (startPos.x + endPos.x) / 2,
      y: startPos.y - 250 // move UP for arc
    }

    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startPos.x, startPos.y),
      new Phaser.Math.Vector2(controlPoint.x, controlPoint.y),
      new Phaser.Math.Vector2(endPos.x, endPos.y)
    )

    this.#monBallWiggleSpriteAnimation.setPosition(startPos.x, startPos.y)
    this.#monBallWiggleSpriteAnimation.setAlpha(1)

    this._scene.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 500,
      onUpdate: (tween, target) => {
        const point = curve.getPoint(target.t)
        this.#monBallWiggleSpriteAnimation.setPosition(point.x, point.y)
      },
      onComplete: () => {
        playBallHitExlpodeAnim()
      }
    })

    const playBallHitExlpodeAnim = () => {
      this.#monBallExpandSpriteAnimation.setPosition(endPos.x, endPos.y - 20)
      this.#monBallExpandSpriteAnimation.setAlpha(1)
      this._phaserMonImageGameObject.setAlpha(0)
      this.#monBallWiggleSpriteAnimation.setAlpha(0)
      
      playBallExplode(() => {
        this.#monBallExpandSpriteAnimation.setAlpha(0)
        this.#monBallWiggleSpriteAnimation.setAlpha(1)
        this._scene.time.delayedCall(500, () => {
          playWiggleAnim(sendResult)
        })
      })
    }
    
    let count = 1
    const playWiggleAnim = (callback) => {
      this.#monBallWiggleSpriteAnimation.play(MON_BALLS.MON_BALL_WIGGLE_ANIMATION)
      this.#monBallWiggleSpriteAnimation.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.#monBallWiggleSpriteAnimation.stop()
        this._scene.time.delayedCall(1000, () => {
          if (count === successRolls) {
            callback()
            return
          }
          count++
          playWiggleAnim(callback)
        })
      })
    }
  }

  /**
   * 
   * @param {() => void} callback 
   * @returns 
   */
  #playWildMonAppearAnimation (callback) {
    const startXPos = -50
    const endXPos = ENEMY_IMAGE_POSITION.x
    const assetKey = MON_ASSET_KEYS[this._phaserMonImageGameObject.texture.key]
    this._phaserMonImageGameObject.setTexture(MON_GRAY_ASSET_KEYS[assetKey + '_GRAY']).setFlipX(true)

    this._phaserMonImageGameObject.setPosition(startXPos, ENEMY_IMAGE_POSITION.y).setAlpha(1)

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setTexture(MON_ASSET_KEYS[assetKey])
      this._phaserMonImageGameObject.setX(endXPos)
      this._phaserHealthBarGameContainer.setAlpha(1)
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
      targets: this._phaserMonImageGameObject,
      onComplete: () => {
        this._phaserMonImageGameObject.setTexture(MON_ASSET_KEYS[assetKey])
        super.playMonCry(() => {
          this._phaserHealthBarGameContainer.setAlpha(1)
          callback()
        })
      }
    })
  }

  /**
   * 
   * @param {() => void} callback 
   * @returns 
   */
  #playTrainerMonAppearAnimation (callback) {
    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setAlpha(1)
      this._phaserHealthBarGameContainer.setAlpha(1)
      callback()
      return
    }

    const endY = this._phaserMonImageGameObject.y
    const endX = this._phaserMonImageGameObject.x
    const steps = 3

    this._phaserMonImageGameObject.setAlpha(1).setScale(0.1).setX(ENEMY_IMAGE_POSITION.x)
    this._phaserMonImageGameObject.y += (this._phaserMonImageGameObject.height - this._phaserMonImageGameObject.height / 4)
    this._phaserMonImageGameObject.x += this._phaserMonImageGameObject.width / 2

    this._scene.tweens.add({
      delay: 0,
      duration: 300,
      scale: 1,
      y: endY,
      x: endX,
      targets: this._phaserMonImageGameObject,
      ease: function (t) {
        return Math.round(t * steps) / steps
      },
      onComplete: () => {
        super.playMonCry(() => {
          this._phaserHealthBarGameContainer.setAlpha(1)
          callback()
        })
      }
    })
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playDeathAnimation (callback) {
    const startYPos = ENEMY_IMAGE_POSITION.y
    const endYPos = startYPos + 224
    this._phaserMonImageGameObject.setDepth(-1)

    if (this._skipBattleAnimations) {
      this._phaserMonImageGameObject.setY(endYPos)
      this._phaserMonImageGameObject.setAlpha(0)
      callback()
      return
    }
    super.playMonCry(() => {
      this._scene.tweens.add({
        delay: 300,
        duration: 350,
        y: {
          from: startYPos,
          to: endYPos
        },
        targets: this._phaserMonImageGameObject,
        onComplete: () => {
          this._phaserHealthBarGameContainer.setAlpha(0)
          this._phaserMonImageGameObject.setAlpha(0)
          callback()
        }
      })
    })
  }

  /**
   * 
   * @param {number} hp 
   * @param {() => void} callback 
   */
  healHp (hp, callback) {
    // update current hp, animate hp bar
    this._currentHealth += hp
    if (this._currentHealth > this._maxHealth) {
      this._currentHealth = this._maxHealth
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth, this._currentHealth / this._maxHealth, { callback })
  }
}