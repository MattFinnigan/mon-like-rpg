import { UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { DIRECTION } from "../types/direction.js"
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../utils/data-manager.js"
import { DataUtils } from "../utils/data-utils.js"
import { exhaustiveGuard } from "../utils/guard.js"
import { SCENE_KEYS } from "../scenes/scene-keys.js"
import { EVENT_KEYS } from "../types/event-keys.js"


export class ItemMenu {
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
  /** @type {import("../types/typedef.js").Inventory} */
  #inventory
  /** @type {Phaser.GameObjects.BitmapText[]} */
  #menuOptionsTextGameObjects
  /** @type {number} */
  #selectedItemOptionIndex
  /** @type {import("../types/typedef.js").Item} */
  #selectedItemOption
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor
  /** @type {import("../types/typedef.js").Item[]} */
  #itemDetails

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#padding = 4
    this.#width = 275
    this.#height = 555
    this.#selectedItemOptionIndex = 0
    this.#menuOptionsTextGameObjects = []
    this.#itemDetails = DataUtils.getItemDetails(this.#scene)

    this.#scene.events.on(EVENT_KEYS.ITEM_CONSUMED, () => this.#createItemMenuGameObjects())
    this.#createItemMenuGameObjects()
  }

  /**
   * @returns {boolean}
   */
  get isVisible () {
    return this.#isVisible
  }

  /**
   * @returns {import("../types/typedef.js").Item}
   */
  get selectedItemOption () {
    return this.#selectedItemOption
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
    this.#selectedItemOptionIndex = 0
    this.#moveMenuCursor(DIRECTION.NONE)
  }

  /**
   * 
   * @param {import("../types/direction.js").Direction|'OK'|'CANCEL'} input 
   */
  handlePlayerInput (input) {
    if (input === 'CANCEL') {
      this.hide()
      return
    }

    if (input === 'OK') {
      this.#handleSelectedItemOption()
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
  #handleSelectedItemOption () {
    const detail = this.#itemDetails.find(details => {
      return details.key === this.#inventory[this.#selectedItemOptionIndex].itemKey
    })
    this.#selectedItemOption = detail
  }

  /**
   * 
   * @param {import("../types/direction.js").Direction} direction
   * @returns {void}
   */
  #moveMenuCursor (direction) {
    this.#selectedItemOption = null
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedItemOptionIndex -= 1
        if (this.#selectedItemOptionIndex < 0) {
          this.#selectedItemOptionIndex = this.#inventory.length - 1
        }
        break
      case DIRECTION.DOWN:
        this.#selectedItemOptionIndex += 1
        if (this.#selectedItemOptionIndex > this.#inventory.length - 1) {
          this.#selectedItemOptionIndex = 0
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
    const y = 28 + this.#padding + this.#selectedItemOptionIndex * 60

    this.#userInputCursor.setPosition(x, y)
  }

  #getPlayerInvetory () {
    this.#inventory = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY)
  }

  #createItemMenuGameObjects () {    
    this.#getPlayerInvetory()

    this.#graphics = this.#createGraphics()
    this.#container = this.#scene.add.container(0, 0, [this.#graphics]).setDepth(2)

    for (let i = 0; i < this.#inventory.length; i++) {
      const y = 10 + 60 * i + this.#padding
      const textObject = this.#scene.add.bitmapText(40 + this.#padding, y, 'gb-font', this.#inventory[i].itemKey, 40)
      const quantityObject = this.#scene.add.bitmapText(this.#width - 80 - this.#padding, y + 33, 'gb-font', `x${this.#inventory[i].qty}`, 30)
      this.#menuOptionsTextGameObjects.push(textObject)
      this.#menuOptionsTextGameObjects.push(quantityObject)
      this.#container.add(textObject)
      this.#container.add(quantityObject)
    }
    this.#createUserInputCursor()
    this.#container.add(this.#userInputCursor)

    this.hide()
  }

  #createUserInputCursor () {
    this.#userInputCursor = this.#scene.add.image(20 + this.#padding, 28 + this.#padding, UI_ASSET_KEYS.CURSOR)
    this.#userInputCursor.setScale(1.25)
  }
}