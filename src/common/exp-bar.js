import { SKIP_ANIMATIONS } from "../../config.js"
import { calculateExperiencedNeededForLevelUp } from "../utils/battle-utils.js"

export class ExpBar {
  /** @type {Phaser.Scene}} */
  #scene
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {Phaser.GameObjects.Rectangle} */
  #phaserCurrentExpBarGameObject
  /** @type {number} */
  #fullWidth
  /** @type {number} */
  #currentExp
  /** @type {number} */
  #expToNextLevel
  /** @type {number} */
  #currentLevel
  /** @type {Phaser.GameObjects.BitmapText} */
  #phaserCurrentExpText
  /** @type {number} */
  #expForCurrentLevel
  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {number} config.currentExp
   * @param {number} config.currentLevel
   */
  constructor (scene, config) {
    this.#scene = scene

    this.#scene = scene
    this.#fullWidth = 260
    this.#currentExp = config.currentExp
    this.#currentLevel = config.currentLevel

    this.#expForCurrentLevel = calculateExperiencedNeededForLevelUp(this.#currentLevel - 1)
    this.#expToNextLevel = calculateExperiencedNeededForLevelUp(this.#currentLevel)

    this.#container = this.#scene.add.container(config.x, config.y, [])
    this.#createExpBarGameObjects()
    this.#setMeterPercentage()
  }

  /**
   * @returns {Phaser.GameObjects.Container}
   */
  get container () {
    return this.#container
  }

  #createExpBarGameObjects () {
    this.#phaserCurrentExpBarGameObject = this.#scene.add.rectangle(0, 0, 0, 8, 0x0096FF).setOrigin(0)
    this.#phaserCurrentExpText = this.#scene.add.bitmapText(-300, 15, 'gb-font', `${this.#currentExp}/${this.#expToNextLevel}`, 20)
      .setOrigin(0).setAlpha(0)
    this.#container.add([
      this.#phaserCurrentExpBarGameObject,
      this.#phaserCurrentExpText
    ])
  }

  #setMeterPercentage () {
    const percent = (this.#currentExp - this.#expForCurrentLevel) / (this.#expToNextLevel - this.#expForCurrentLevel)
    const width = this.#fullWidth * percent
    this.#phaserCurrentExpBarGameObject.width = width
    this.#phaserCurrentExpBarGameObject.setX(-width + 1)
  }

  /**
   * @param {number} targetExp new Exp
   * @param {Object} [options]
   * @param {number} [options.duration=1000]
   * @param {(levelsGained: number) => void} [options.callback]
   * @param {number} [options.levelsGained]
   */
  setMeterPercentageAnimated (targetExp, options) {
    let percent = (targetExp - this.#expForCurrentLevel) / (this.#expToNextLevel - this.#expForCurrentLevel)
    const duration = options?.duration || (SKIP_ANIMATIONS ? 0 : 1000)
    let width = this.#fullWidth * percent

    if (percent > 1) {
      this.#expForCurrentLevel = this.#expToNextLevel
      this.#currentLevel++
      this.#expToNextLevel = calculateExperiencedNeededForLevelUp(this.#currentLevel)
      width = this.#fullWidth
    }

    this.#scene.tweens.add({
      targets: this.#phaserCurrentExpBarGameObject,
      displayWidth: width,
      x: -width + 1,
      duration,
      ease: Phaser.Math.Easing.Sine.Out,
      onComplete: () => {
        if (percent > 1) {
          this.#phaserCurrentExpBarGameObject.displayWidth = 0
          this.#phaserCurrentExpBarGameObject.setX(1)
          this.setMeterPercentageAnimated(targetExp, {
            callback: options.callback,
            levelsGained: options.levelsGained ? options.levelsGained + 1 : 1
          })
          return
        }
        this.#currentExp = targetExp
        this.#phaserCurrentExpText.setText(`${this.#currentExp}/${this.#expToNextLevel}`)
        if (options?.callback) {
          options.callback(options.levelsGained || 0)
        }
      }
    })
  }
}