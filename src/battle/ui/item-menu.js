import { UI_ASSET_KEYS } from "../../assets/asset-keys.js"
import { DIRECTION } from "../../common/direction.js"
import { DATA_MANAGER_STORE_KEYS, dataManager } from "../../utils/data-manager.js"
import { DataUtils } from "../../utils/data-utils.js"
import { exhaustiveGuard } from "../../utils/guard.js"


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
  /** @type {import("../../types/typedef").Item[]} */
  #availableItems
  /** @type {Phaser.GameObjects.BitmapText[]} */
  #menuOptionsTextGameObjects
  /** @type {number} */
  #selectedItemOptionIndex
  /** @type {import("../../types/typedef").Item} */
  #selectedItemOption
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
    this.#height = 555

    const itemDetails = DataUtils.getItemDetails(this.#scene)
  
    this.#availableItems = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY).map(invItem => {
      return itemDetails.find(itemDetail => itemDetail.key === invItem.itemKey )
    })
    

    this.#menuOptionsTextGameObjects = []
    this.#selectedItemOptionIndex = 0
    this.#graphics = this.#createGraphics()
    this.#container = this.#scene.add.container(0, 0, [this.#graphics])

    for (let i = 0; i < this.#availableItems.length; i++) {
      const y = 10 + 50 * i + this.#padding
      const textObject = this.#scene.add.bitmapText(40 + this.#padding, y, 'gb-font', this.#availableItems[i].name, 40)
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
   * @returns {import("../../types/typedef").Item}
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
   * @param {import("../../common/direction").Direction|'OK'|'CANCEL'} input 
   */
  handlePlayerInput (input) {
    console.log(input)
    if (input === 'CANCEL') {
      this.hide()
      return
    }

    if (input === 'OK') {
      this.#handleselectedItemOption()
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
  #handleselectedItemOption () {
    this.#selectedItemOption = this.#availableItems[this.#selectedItemOptionIndex]
  }

  /**
   * 
   * @param {import("../../common/direction").Direction} direction
   * @returns {void}
   */
  #moveMenuCursor (direction) {

    switch (direction) {
      case DIRECTION.UP:
        this.#selectedItemOptionIndex -= 1
        if (this.#selectedItemOptionIndex < 0) {
          this.#selectedItemOptionIndex = this.#availableItems.length - 1
        }
        break
      case DIRECTION.DOWN:
        this.#selectedItemOptionIndex += 1
        if (this.#selectedItemOptionIndex > this.#availableItems.length - 1) {
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
    const y = 28 + this.#padding + this.#selectedItemOptionIndex * 50

    this.#userInputCursor.setPosition(x, y)
  
  }
}