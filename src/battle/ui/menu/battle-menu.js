import Phaser from '../../../lib/phaser.js'
import { SYSTEM_ASSET_KEYS, BATTLE_ASSET_KEYS, UI_ASSET_KEYS } from '../../../assets/asset-keys.js'
import { DIRECTION } from '../../../common/direction.js'
import { exhaustiveGuard } from '../../../utils/guard.js'
/**
 * @typedef {keyof typeof BATTLE_MENU_OPTIONS} BattleMenuOptions
 */

/** @enum {BattleMenuOptions} */
const BATTLE_MENU_OPTIONS = Object.freeze({
  FIGHT: 'FIGHT',
  PKMN: 'PKMN',
  ITEM: 'ITEM',
  RUN: 'RUN'
})

const BATTLE_MENU_CURSOR_POS = Object.freeze({
  x: 30,
  y: 55
})

export class BattleMenu {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Number} */
  #INFO_POS_Y
  /** @type {Phaser.GameObjects.Container} */
  #mainBattleMenuPhaserContainerGameObject
  /** @type {Phaser.GameObjects.Container} */
  #moveSelectionSubBattleMenuPhaserContainerGameObject
  /** @type {Phaser.GameObjects.BitmapText} */
  #battleTextGameObjectLine1
  /** @type {Phaser.GameObjects.BitmapText} */
  #battleTextGameObjectLine2
  /** @type {Phaser.GameObjects.Image} */
  #mainBattleCursorPhaserImageGameObject
  /** @type {BattleMenuOptions} */
  #selectedBattleMenuOption
  /** @type {Phaser.GameObjects.Image} */
  #attackBattleCursorPhaserImageGameObject
  /** @type {BattleMenuOptions} */
  #selectedAttackBattleMenuOption
  /**
   * 
   * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
   */
  constructor (scene) {
    this.#scene = scene
    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
    this.#INFO_POS_Y = (this.#scene.scale.height / 3) * 2
    this.#createMainInfoPane(0, this.#INFO_POS_Y)
    this.#createMainBattleMenu()
    this.#createMonAttackSubMenu()
  }

  showMainBattleMenu () {
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1)
    this.#battleTextGameObjectLine1.setAlpha(1)
    this.#battleTextGameObjectLine2.setAlpha(1)

    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
    this.#mainBattleCursorPhaserImageGameObject.setPosition(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y)
  }

  hideMainBattleMenu () {
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0)
    this.#battleTextGameObjectLine1.setAlpha(0)
    this.#battleTextGameObjectLine2.setAlpha(0)
  }

  showMonAttackSubMenu () {
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1)
  }

  hideMonAttackSubMenu () {
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0)
  }
  /**
   * 
   * @param {import('../../../common/direction.js').Direction | 'OK'|'CANCEL'} input
   */
  handlePlayerInput (input) {
    console.log(input)
    if (input === 'CANCEL') {
      this.hideMonAttackSubMenu()
      this.showMainBattleMenu()
      return
    }

    if (input === 'OK') {
      this.hideMainBattleMenu()
      this.showMonAttackSubMenu()
      return
    }

    this.#updateSelectedBattleMenuOptionFromInput(input)
    this.#moveMainBattleMenuCursor()
  }
  
  #createMainBattleMenu () {
    const MENU_POS_Y = 300
    this.#battleTextGameObjectLine1 = this.#scene.add.bitmapText(55, this.#INFO_POS_Y + 45, 'gb-font', 'I Like', 40)
    this.#battleTextGameObjectLine2 = this.#scene.add.bitmapText(55, this.#INFO_POS_Y + 100, 'gb-font', 'Turtles', 40)
    this.#mainBattleCursorPhaserImageGameObject = this.#scene.add.image(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setScale(1.35)

    this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(MENU_POS_Y, this.#INFO_POS_Y, [
        this.#createMainInfoSubPane(),
        this.#scene.add.bitmapText(55, 45, 'gb-font', BATTLE_MENU_OPTIONS.FIGHT, 40),
        this.#scene.add.bitmapText(215, 50, 'gb-font-small', 'P', 30),
        this.#scene.add.bitmapText(228, 64, 'gb-font-small', 'K', 30),
        this.#scene.add.bitmapText(245, 50, 'gb-font-small', 'M', 30),
        this.#scene.add.bitmapText(252, 64, 'gb-font-small', 'N', 30),
        this.#scene.add.bitmapText(55, 110, 'gb-font', BATTLE_MENU_OPTIONS.ITEM, 40),
        this.#scene.add.bitmapText(215, 110, 'gb-font', BATTLE_MENU_OPTIONS.RUN, 40),
        this.#mainBattleCursorPhaserImageGameObject
      ]
    )
    this.hideMainBattleMenu()
  }

  #createMonAttackSubMenu () {
    this.#attackBattleCursorPhaserImageGameObject = this.#scene.add.image(0, 0, UI_ASSET_KEYS.CURSOR, 0).setOrigin()
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, this.#INFO_POS_Y, [
      this.#scene.add.bitmapText(55, 45, 'gb-font', 'SLASH', 40),
      this.#scene.add.bitmapText(215, 45, 'gb-font', 'SLASH', 40),
      this.#scene.add.bitmapText(55, 110, 'gb-font', '-', 40),
      this.#scene.add.bitmapText(215, 110, 'gb-font', '-', 40),
      this.#attackBattleCursorPhaserImageGameObject
    ])

    this.hideMonAttackSubMenu()
  }

  #createMainInfoPane (x, y) {
    return this.#scene.add.image(x, y, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
  }

  #createMainInfoSubPane () {
    return this.#scene.add.image(0, 0, BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND).setOrigin(0)
  }

  /**
   * 
   * @param {import('../../../common/direction.js').Direction} direction
   */
  #updateSelectedBattleMenuOptionFromInput (direction) {
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.PKMN
          return
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM
          return
        case DIRECTION.LEFT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.PKMN) {
      switch (direction) {
        case DIRECTION.DOWN:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.RUN
          return
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.RUN
          return
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
          return
        case DIRECTION.LEFT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.RUN) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.ITEM
          return
        case DIRECTION.UP:
          this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.PKMN
          return
        case DIRECTION.DOWN:
        case DIRECTION.RIGHT:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    exhaustiveGuard(this.#selectedBattleMenuOption)
  }

  #moveMainBattleMenuCursor () {
    switch (this.#selectedBattleMenuOption) {
      case BATTLE_MENU_OPTIONS.FIGHT:
        this.#mainBattleCursorPhaserImageGameObject.setPosition(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y)
        return
      case BATTLE_MENU_OPTIONS.PKMN:
        this.#mainBattleCursorPhaserImageGameObject.setPosition(190, BATTLE_MENU_CURSOR_POS.y)
        return
      case BATTLE_MENU_OPTIONS.ITEM:
        this.#mainBattleCursorPhaserImageGameObject.setPosition(BATTLE_MENU_CURSOR_POS.x, 115)
        return
      case BATTLE_MENU_OPTIONS.RUN:
        this.#mainBattleCursorPhaserImageGameObject.setPosition(190, 115)
        return
      default:
        exhaustiveGuard(this.#selectedBattleMenuOption)
    }
  }
}