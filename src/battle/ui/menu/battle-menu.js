import Phaser from '../../../lib/phaser.js'
import { SYSTEM_ASSET_KEYS, BATTLE_ASSET_KEYS, UI_ASSET_KEYS } from '../../../assets/asset-keys.js'
import { DIRECTION } from '../../../common/direction.js'
import { exhaustiveGuard } from '../../../utils/guard.js'
import { ACTIVE_BATTLE_MENU, ATTACK_MOVE_OPTIONS, BATTLE_MENU_OPTIONS } from './battle-menu-options.js'
import { BattleMon } from '../../mons/battle-mon.js'

const BATTLE_MENU_CURSOR_POS = Object.freeze({
  x: 30,
  y: 50
})

const ATTACK_MENU_CURSOR_POS = Object.freeze({
  x: 28,
  y: 50
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
  /** @type {import('./battle-menu-options.js').BattleMenuOptions} */
  #selectedBattleMenuOption
  /** @type {Phaser.GameObjects.Image} */
  #attackCursorPhaserImageGameObject
  /** @type {import('./battle-menu-options.js').AttackMoveOptions} */
  #selectedAttackMenuOption
  /** @type {import('./battle-menu-options.js').ActiveBattleMenu} */
  #activeBattleMenu
  /** @type {string[]} */
  #queuedInfoPanelMessages
  /** @type {() => void | undefined} */
  #queuedInfoPanelCallback
  /** @type {Boolean} */
  #waitingForPlayerInput
  /** @type {number | undefined} */
  #selectedAttackIndex
  /** @type {BattleMon} */
  #activePlayerMon

  /**
   * 
   * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
   * @param {BattleMon} activePlayerMon
   */
  constructor (scene, activePlayerMon) {
    this.#scene = scene
    this.#activePlayerMon = activePlayerMon
    this.#INFO_POS_Y = (this.#scene.scale.height / 3) * 2
    this.#battleTextGameObjectLine1 = this.#scene.add.bitmapText(55, this.#INFO_POS_Y + 45, 'gb-font', '', 40)
    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#queuedInfoPanelCallback = undefined
    this.#queuedInfoPanelMessages = []
    this.#waitingForPlayerInput = false
    
    this.#createMainInfoPane(0, this.#INFO_POS_Y)
    this.#createMainBattleMenu()
    this.#createMonAttackSubMenu()
  }

  /** @type {number | undefined} */
  get selectedAttack () {
    if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return this.#selectedAttackIndex
    }
    return undefined
  }

  showMainBattleMenu () {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1)
    this.#battleTextGameObjectLine1.setAlpha(1)
    this.#battleTextGameObjectLine2.setAlpha(1)

    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
    this.#mainBattleCursorPhaserImageGameObject.setPosition(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y)
    this.#selectedAttackIndex = undefined
  }

  hideMainBattleMenu () {
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(0)
    this.#battleTextGameObjectLine1.setAlpha(0)
    this.#battleTextGameObjectLine2.setAlpha(0)
  }

  showMonAttackSubMenu () {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(1)
  }

  hideMonAttackSubMenu () {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0)
  }
  /**
   * 
   * @param {import('../../../common/direction.js').Direction | 'OK'|'CANCEL'} input
   */
  handlePlayerInput (input) {
    if (this.#waitingForPlayerInput && (input === 'CANCEL' || input === 'OK')) {
      this.#updateInfoPaneWithMessage()
      return
    }

    if (input === 'CANCEL') {
      this.#switchToMainBattleMenu()
      return
    }

    if (input === 'OK') {
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
        this.#handlePlayerChooseMainBattleOption()
        return
      }
      if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
        this.#handlePlayerChooseAttack()
        return
      }
      return
    }

    this.#updateSelectedBattleMenuOptionFromInput(input)
    this.#moveMainBattleMenuCursor()
    this.#updateSelectedMoveMenuOptionFromInput(input)
    this.#moveMoveSelectBattleMenuCursor()
  }

  /**
   * 
   * @param {string[]} messages 
   * @param {() => void} [callback] 
   */
  updateInfoPanelMessagesAndWaitForInput (messages, callback) {
    this.#queuedInfoPanelMessages = messages
    this.#queuedInfoPanelCallback = callback

    this.#updateInfoPaneWithMessage()
  }

  #updateInfoPaneWithMessage () {
    this.#waitingForPlayerInput = false
    this.#battleTextGameObjectLine1.setText('').setAlpha(1)

    // check if all msgs have been displayed from queue, call the callback
    if (this.#queuedInfoPanelMessages.length === 0) {
      if (this.#queuedInfoPanelCallback) {
        this.#queuedInfoPanelCallback()
        this.#queuedInfoPanelCallback = undefined
      }
      return
    }

    // get next msg from queue and animate
    const messageToDisplay = this.#queuedInfoPanelMessages.shift()
    this.#battleTextGameObjectLine1.setText(messageToDisplay)
    this.#waitingForPlayerInput = true
  }
  
  #createMainBattleMenu () {
    const MENU_POS_Y = 300
    this.#battleTextGameObjectLine1 = this.#scene.add.bitmapText(30, this.#INFO_POS_Y + 45, 'gb-font', '', 30)
    this.#battleTextGameObjectLine2 = this.#scene.add.bitmapText(30, this.#INFO_POS_Y + 100, 'gb-font', '', 30)
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
    this.#attackCursorPhaserImageGameObject = this.#scene.add.image(ATTACK_MENU_CURSOR_POS.x, ATTACK_MENU_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0)
      .setOrigin(0)
      .setScale(1.35)

    /** @type {string[]} */
    const attackNames = []
    for (let i = 0; i < 4; i++) {
      attackNames.push(this.#activePlayerMon.attacks[i]?.name || '-')
    }

    this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, this.#INFO_POS_Y, [
      this.#scene.add.bitmapText(55, 45, 'gb-font', attackNames[0], 30),
      this.#scene.add.bitmapText(350, 45, 'gb-font', attackNames[1], 30),
      this.#scene.add.bitmapText(55, 110, 'gb-font', attackNames[2], 30),
      this.#scene.add.bitmapText(350, 110, 'gb-font', attackNames[3], 30),
      this.#attackCursorPhaserImageGameObject
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
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
      return
    }
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
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MAIN) {
      return
    }
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
  /**
   * 
   * @param {import('../../../common/direction.js').Direction} direction
   */
  #updateSelectedMoveMenuOptionFromInput (direction) {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return
    }
    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_1) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2
          return
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3
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

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_2) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
          return
        case DIRECTION.DOWN:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4
          return
        case DIRECTION.RIGHT:
        case DIRECTION.UP:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_3) {
      switch (direction) {
        case DIRECTION.RIGHT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_4
          return
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
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

    if (this.#selectedAttackMenuOption === ATTACK_MOVE_OPTIONS.MOVE_4) {
      switch (direction) {
        case DIRECTION.LEFT:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_3
          return
        case DIRECTION.UP:
          this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_2
          return
        case DIRECTION.RIGHT:
        case DIRECTION.DOWN:
        case DIRECTION.NONE:
          return
        default:
          exhaustiveGuard(direction)
      }
      return
    }

    exhaustiveGuard(this.#selectedAttackMenuOption)
  }

  #moveMoveSelectBattleMenuCursor () {
    if (this.#activeBattleMenu !== ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return
    }
    switch (this.#selectedAttackMenuOption) {
      case ATTACK_MOVE_OPTIONS.MOVE_1:
        this.#attackCursorPhaserImageGameObject.setPosition(ATTACK_MENU_CURSOR_POS.x, ATTACK_MENU_CURSOR_POS.y)
        return
      case ATTACK_MOVE_OPTIONS.MOVE_2:
        this.#attackCursorPhaserImageGameObject.setPosition(325, ATTACK_MENU_CURSOR_POS.y)
        return
      case ATTACK_MOVE_OPTIONS.MOVE_3:
        this.#attackCursorPhaserImageGameObject.setPosition(ATTACK_MENU_CURSOR_POS.x, 115)
        return
      case ATTACK_MOVE_OPTIONS.MOVE_4:
        this.#attackCursorPhaserImageGameObject.setPosition(325, 115)
        return
      default:
        exhaustiveGuard(this.#selectedAttackMenuOption)
    }
  }

  #switchToMainBattleMenu () {
    this.hideMonAttackSubMenu()
    this.showMainBattleMenu()
  }

  #handlePlayerChooseMainBattleOption () {
    this.hideMainBattleMenu()
    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.FIGHT) {
      this.showMonAttackSubMenu()
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.ITEM) {
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM
      this.updateInfoPanelMessagesAndWaitForInput(['Your bag is empty...'], () => {
        this.#switchToMainBattleMenu()
      })
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.PKMN) {
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_PKMN
      this.updateInfoPanelMessagesAndWaitForInput(['You can\'t switch!'], () => {
        this.#switchToMainBattleMenu()
      })
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.RUN) {
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_RUN
      this.updateInfoPanelMessagesAndWaitForInput(['Couldn\'t get away!'], () => {
        this.#switchToMainBattleMenu()
      })
      return
    }

    exhaustiveGuard(this.#selectedBattleMenuOption)
  }

  #handlePlayerChooseAttack () {
    let selectedMoveIndex = 0
    switch (this.#selectedAttackMenuOption) {
      case ATTACK_MOVE_OPTIONS.MOVE_1:
        selectedMoveIndex = 0
        break
      case ATTACK_MOVE_OPTIONS.MOVE_2:
        selectedMoveIndex = 1
        break
      case ATTACK_MOVE_OPTIONS.MOVE_3:
        selectedMoveIndex = 2
        break
      case ATTACK_MOVE_OPTIONS.MOVE_4:
        selectedMoveIndex = 3
        break
      default:
        exhaustiveGuard(this.#selectedAttackMenuOption)
    }

    this.#selectedAttackIndex = selectedMoveIndex
  }
}