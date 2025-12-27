import { HEALTH_BAR_ASSET_KEYS } from '../../assets/asset-keys.js'
import Phaser from '../../lib/phaser.js'

export class HealthBar {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.GameObjects.Container} */
  #healthBarContainer
  /** @type {number} */
  #fullWidth
  /** @type {number} */
  #scale
  /** @type {Phaser.GameObjects.Image} */
  #leftCap
  /** @type {Phaser.GameObjects.Image} */
  #middle
  /** @type {Phaser.GameObjects.Image} */
  #rightCap

  /**
   * 
   * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
   * @param {number} x
   * @param {number} y
   */
  constructor (scene, x, y) {
    this.#scene = scene
    this.#fullWidth = 190
    this.#scale = 1.35
    this.#healthBarContainer = this.#scene.add.container(x, y, [])
    this.#createHealthBarImages(x, y)
    this.#setMeterPercentage(1)
  }

  get container () {
    return this.#healthBarContainer
  }

  /**
   * 
   * @param {Number} x the x position to place the health bar container 
   * @param {Number} y the y position to place the health bar container
   * @returns {void}
   */
  #createHealthBarImages (x, y) {
    this.#leftCap = this.#scene.add.image(0, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP).setOrigin(0, 0.5).setScale(this.#scale)
    this.#middle = this.#scene.add.image(this.#leftCap.x + this.#leftCap.width, y, HEALTH_BAR_ASSET_KEYS.MIDDLE).setOrigin(0, 0.5).setScale(this.#scale)
    this.#rightCap = this.#scene.add.image(this.#middle.x + this.#middle.displayWidth, y, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP).setOrigin(0, 0.5).setScale(this.#scale)

    this.#healthBarContainer.add([this.#leftCap, this.#middle, this.#rightCap])
  }

  /**
   * 
   * @param {number} [percent=1] a number between 0 and 1 that is used for setting how filled the hp bar is
   */
  #setMeterPercentage (percent = 1) {
    const width = this.#fullWidth * percent
    this.#middle.displayWidth = width
    this.#rightCap.x = this.#middle.x + this.#middle.displayWidth
  }

  /**
   * 
   * @param {number} percent a number between 0 and 1 that is used for setting how filled the hp bar is
   * @param {Object} [options]
   * @param {number} [options.duration=1000]
   * @param {() => void} [options.callback]
   */
  setMeterPercentageAnimated (percent, options) {
    const width = this.#fullWidth * percent

    this.#scene.tweens.add({
      targets: this.#middle,
      displayWidth: width,
      duration: options?.duration || 1000,
      ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: () => {
        this.#rightCap.x = this.#middle.x + this.#middle.displayWidth
        const isVisible = this.#middle.displayWidth > 0
        this.#leftCap.visible = isVisible
        this.#middle.visible = isVisible
        this.#rightCap.visible = isVisible
      },
      onComplete: options?.callback
    })
  }
}