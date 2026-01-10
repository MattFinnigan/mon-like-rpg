import { UI_ASSET_KEYS } from "../../assets/asset-keys.js"
import { DIRECTION } from "../../types/direction.js"
import Phaser from "../../lib/phaser.js"
import { exhaustiveGuard } from "../../utils/guard.js"

/**
 * @typedef {keyof typeof MENU_OPTIONS} MenuOptions
 */

/** @enum {MenuOptions} */
export const MENU_OPTIONS = Object.freeze({
  POKEDEX: 'POKEDEX',
  POKEMON: 'POKEMON',
  ITEM: 'ITEM',
  SAVE: 'SAVE',
  OPTIONS: 'OPTIONS',
  EXIT: 'EXIT'
})


export class Menu {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {number} */
  #padding
  /** @type {number} */
  #width
  /** @type {number} */
  #height
  /** @type {Phaser.GameObjects.Graphics} */
  #graphics
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {boolean} */
  #isVisible
  /** @type {MenuOptions[]} */
  #availaleMenuOptions
  /** @type {Phaser.GameObjects.BitmapText[]} */
  #menuOptionsTextGameObjects
  /** @type {number} */
  #selectedMenuOptionIndex
  /** @type {MenuOptions} */
  #selectedMenuOption
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#padding = 4
    this.#width = 275
    this.#availaleMenuOptions = [MENU_OPTIONS.POKEMON, MENU_OPTIONS.ITEM, MENU_OPTIONS.SAVE, MENU_OPTIONS.EXIT]
    this.#height = 10 + this.#padding * 2 + this.#availaleMenuOptions.length * 50

    this.#menuOptionsTextGameObjects = []
    this.#selectedMenuOptionIndex = 0
    this.#graphics = this.#createGraphics()
    this.#container = this.#scene.add.container(0, 0, [this.#graphics])

    for (let i = 0; i < this.#availaleMenuOptions.length; i++) {
      const y = 10 + 50 * i + this.#padding
      const textObject = this.#scene.add.bitmapText(40 + this.#padding, y, 'gb-font', this.#availaleMenuOptions[i], 40)
      this.#menuOptionsTextGameObjects.push(textObject)
      this.#container.add(textObject)
    }

    this.#userInputCursor = this.#scene.add.image(20 + this.#padding, 28 + this.#padding, UI_ASSET_KEYS.CURSOR)
    this.#userInputCursor.setScale(1.25)
    this.#container.add(this.#userInputCursor)

    this.hide()
  }

  /**
   * @returns {boolean}
   */
  get isVisible () {
    return this.#isVisible
  }

  /**
   * @returns {MenuOptions}
   */
  get selectedMenuOption () {
    return this.#selectedMenuOption
  }

  show () {
    const { right, top } = this.#scene.cameras.main.worldView
    const startX = right - this.#padding * 2 - this.#width
    const startY = top + this.#padding * 2
    this.#container.setPosition(startX, startY)
    this.#container.setAlpha(1)
    this.#isVisible = true
  }

  hide () {
    this.#container.setAlpha(0)
    this.#isVisible = false
    this.#selectedMenuOptionIndex = 0
    this.#moveMenuCursor(DIRECTION.NONE)
  }

  /**
   * 
   * @param {import("../../types/direction").Direction|'OK'|'CANCEL'} input 
   */
  handlePlayerInput (input) {
    if (input === 'CANCEL') {
      this.hide()
      return
    }

    if (input === 'OK') {
      this.#handleSelectedMenuOption()
      return
    }

    this.#moveMenuCursor(input)
  }

  #createGraphics () {
    const g = this.#scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(1, 0, this.#width - 1, this.#height - 1)
    g.lineStyle(4, 0x000000, 1)
    g.strokeRect(0, 0, this.#width, this.#height)

    return g
  }

  /**
   * @returns {void}
   */
  #handleSelectedMenuOption () {
    this.#selectedMenuOption = this.#availaleMenuOptions[this.#selectedMenuOptionIndex]
  }

  /**
   * 
   * @param {import("../../types/direction").Direction} direction
   * @returns {void}
   */
  #moveMenuCursor (direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedMenuOptionIndex -= 1
        if (this.#selectedMenuOptionIndex < 0) {
          this.#selectedMenuOptionIndex = this.#availaleMenuOptions.length - 1
        }
        break
      case DIRECTION.DOWN:
        this.#selectedMenuOptionIndex += 1
        if (this.#selectedMenuOptionIndex > this.#availaleMenuOptions.length - 1) {
          this.#selectedMenuOptionIndex = 0
        }
        break
      case DIRECTION.RIGHT:
      case DIRECTION.LEFT:
        return
      case DIRECTION.NONE:
        break
      default:
        exhaustiveGuard(direction)
        break
    }

    const x = 20 + this.#padding
    const y = 28 + this.#padding + this.#selectedMenuOptionIndex * 50

    this.#userInputCursor.setPosition(x, y)
  
  }
}