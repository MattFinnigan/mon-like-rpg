import Phaser from '../../../lib/phaser.js'
import { SYSTEM_ASSET_KEYS, BATTLE_ASSET_KEYS, UI_ASSET_KEYS } from '../../../assets/asset-keys.js'
import { DIRECTION } from '../../../types/direction.js'
import { exhaustiveGuard } from '../../../utils/guard.js'
import { ACTIVE_BATTLE_MENU, ATTACK_MOVE_OPTIONS, BATTLE_MENU_OPTIONS } from './battle-menu-options.js'
import { animateText } from '../../../utils/text-utils.js'
import { SKIP_ANIMATIONS } from '../../../../config.js'
import { DIALOG_DETAILS } from '../../../types/dialog-ui.js'
import { PlayerBattleMon } from '../../mons/player-battle-monster.js'
import { ItemMenu } from '../../../common/item-menu.js'
import { EVENT_KEYS } from '../../../types/event-keys.js'


const BATTLE_MENU_CURSOR_POS = Object.freeze({
  x: 30,
  y: 50
})

const ATTACK_MENU_CURSOR_POS = Object.freeze({
  x: 28,
  y: 50
})

const PLAYER_INPUT_CURSOR_POS = Object.freeze({
  y: DIALOG_DETAILS.y + 50
})

export class BattleMenu {
  /** @type {Phaser.Scene} */
  #scene
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
  /** @type {PlayerBattleMon} */
  #activePlayerMon
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursorPhaserGameImageObject
  /** @type {Phaser.Tweens.Tween} */
  #userInputCursorPhaserTween
  /** @type {boolean} */
  #queuedMessageSkipAnimation
  /** @type {boolean} */
  #queuedMessageAnimationPlaying
  /** @type {ItemMenu} */
  #battleItemMenu
  /** @type {import('../../../types/typedef.js').Item} */
  #selectedItem

  /**
   * 
   * @param {Phaser.Scene} scene the Phaser 3 Scene the battle menu will be added to
   * @param {PlayerBattleMon} [activePlayerMon]
   */
  constructor (scene, activePlayerMon) {
    this.#scene = scene
    this.#activePlayerMon = activePlayerMon
    this.#selectedBattleMenuOption = BATTLE_MENU_OPTIONS.FIGHT
    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#queuedInfoPanelCallback = undefined
    this.#queuedInfoPanelMessages = []
    this.#waitingForPlayerInput = false
    this.#queuedMessageSkipAnimation = false
    this.#queuedMessageAnimationPlaying = false
    this.#selectedItem = undefined

    this.#battleItemMenu = new ItemMenu(this.#scene)
    if (this.#activePlayerMon) {
      this.#createMonAttackSubMenu()
    }
    this.#createMainInfoPane()
    this.#createMainBattleMenu()
    this.#createPlayerInputCursor()
  }

  /** @type {number | undefined} */
  get selectedAttack () {
    if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT) {
      return this.#selectedAttackIndex
    }
    return undefined
  }

  get selectedItem () {
    if (this.#activeBattleMenu === ACTIVE_BATTLE_MENU.BATTLE_ITEM) {
      return this.#selectedItem
    }
    return undefined
  }

  /**
   * @param {PlayerBattleMon} activePlayerMon
   */
  set activePlayerMon (activePlayerMon) {
    this.#activePlayerMon = activePlayerMon
    this.#createMonAttackSubMenu()
  }

  showMainBattleMenu () {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#mainBattleMenuPhaserContainerGameObject.setAlpha(1)
    this.#battleTextGameObjectLine1.setAlpha(1)
    this.#battleTextGameObjectLine2.setAlpha(1)

    this.#selectedAttackIndex = undefined
    this.#selectedItem = undefined
    this.#battleTextGameObjectLine1.setText('')
    this.#battleTextGameObjectLine2.setText('')
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

  showItemMenu () {
    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_ITEM
    this.#battleItemMenu.show()
  }

  hideItemMenu () {
    this.#selectedItem = undefined
    this.#battleItemMenu.hide()
  }

  hideMonAttackSubMenu () {
    // reset attack move tracking
    this.#selectedAttackMenuOption = ATTACK_MOVE_OPTIONS.MOVE_1
    this.#moveMoveSelectBattleMenuCursor()

    this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_MAIN
    this.#moveSelectionSubBattleMenuPhaserContainerGameObject.setAlpha(0)
  }

  playInputCursorAnimation () {
    this.#userInputCursorPhaserGameImageObject.setPosition(
      this.#battleTextGameObjectLine1.displayWidth + this.#userInputCursorPhaserGameImageObject.width * 4,
      this.#userInputCursorPhaserGameImageObject.y
    )
    this.#userInputCursorPhaserGameImageObject.setAlpha(1)
    this.#userInputCursorPhaserTween.restart()
  }

  hideInputCursor () {
    this.#userInputCursorPhaserGameImageObject.setAlpha(0)
    this.#userInputCursorPhaserTween.pause()
  }
  
  /**
   * 
   * @param {import('../../../types/direction.js').Direction | 'OK'|'CANCEL'} input
   */
  handlePlayerInput (input) {
    const state = this.#activeBattleMenu
    if (this.#queuedMessageAnimationPlaying && input === 'OK') {
      return
    }

    if (this.#waitingForPlayerInput && (input === 'CANCEL' || input === 'OK')) {
      this.#updateInfoPaneWithMessage()
      return
    }

    if (input === 'CANCEL') {
      this.#switchToMainBattleMenu()
      return
    }

    if (input === 'OK') {
      switch (state) {
        case ACTIVE_BATTLE_MENU.BATTLE_MAIN:
          this.#handlePlayerChooseMainBattleOption()
          break
        case ACTIVE_BATTLE_MENU.BATTLE_MOVE_SELECT:
          this.#handlePlayerChooseAttack()
          break
        case ACTIVE_BATTLE_MENU.BATTLE_ITEM:
          this.#battleItemMenu.handlePlayerInput('OK')
            this.#selectedItem = this.#battleItemMenu.selectedItemOption
          break
        case ACTIVE_BATTLE_MENU.BATTLE_PKMN:
        case ACTIVE_BATTLE_MENU.BATTLE_RUN:
          break
        default:
          exhaustiveGuard(state)
          break
      }
      return
    }

    if (state === ACTIVE_BATTLE_MENU.BATTLE_ITEM) {
      this.#battleItemMenu.handlePlayerInput(input)
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
   * @param {boolean} [skipAnimation=false]
   */
  updateInfoPanelMessagesAndWaitForInput (messages, callback, skipAnimation = false) {
    this.#scene.time.delayedCall(100, () => {
      this.#queuedInfoPanelMessages = messages
      this.#queuedInfoPanelCallback = callback
      this.#queuedMessageSkipAnimation = skipAnimation

      this.#updateInfoPaneWithMessage()
    })
  }

  /**
   * 
   * @param {string} message 
   * @param {() => void} [callback]
   * @param {boolean} [skipAnimation=false]
   */
  updateInfoPanelMessagesNoInputRequired (message, callback, skipAnimation = false) {
    this.#queuedMessageAnimationPlaying = true
    this.#battleTextGameObjectLine1.setText('').setAlpha(1)
  
    if (skipAnimation) {
      this.#battleTextGameObjectLine1.setText(message)
      this.#waitingForPlayerInput = false
      this.#queuedMessageAnimationPlaying = false
      if (callback) {
        callback()
      }
      return
    }

    animateText(this.#scene, this.#battleTextGameObjectLine1, message, {
      delay: 25,
      callback: () => {
        this.#waitingForPlayerInput = false
        this.#queuedMessageAnimationPlaying = false
        if (callback) {
          callback()
        }
      }
    })
  }

  
  #updateInfoPaneWithMessage () {
    this.#waitingForPlayerInput = false
    this.#battleTextGameObjectLine1.setText('').setAlpha(1)
    this.hideInputCursor()

    // check if all msgs have been displayed from queue, call the callback
    if (this.#queuedInfoPanelMessages.length === 0) {
      if (this.#queuedInfoPanelCallback) {
        this.#queuedInfoPanelCallback()
        this.#queuedInfoPanelCallback = undefined
      }
      this.hideInputCursor()
      return
    }
    const messageToDisplay = this.#queuedInfoPanelMessages.shift()

    if (this.#queuedMessageSkipAnimation) {
      this.#waitingForPlayerInput = true
      this.#battleTextGameObjectLine1.setText(messageToDisplay)
      this.#queuedMessageAnimationPlaying = false
      this.playInputCursorAnimation()
      return
    }
    
    this.#queuedMessageAnimationPlaying = true
    animateText(this.#scene, this.#battleTextGameObjectLine1, messageToDisplay, {
      delay: 25,
      callback: () => {
        this.#waitingForPlayerInput = true
        this.#queuedMessageAnimationPlaying = false
        this.playInputCursorAnimation()
      }
    })
  }
  
  #createMainBattleMenu () {
    const MENU_POS_Y = 300
    this.#createBattleDialogTextGameObjects()
    this.#mainBattleCursorPhaserImageGameObject = this.#scene.add.image(BATTLE_MENU_CURSOR_POS.x, BATTLE_MENU_CURSOR_POS.y, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setScale(1.35)
    this.#mainBattleMenuPhaserContainerGameObject = this.#scene.add.container(MENU_POS_Y, DIALOG_DETAILS.y, [
        this.#createMainInfoSubPane(),
        this.#scene.add.bitmapText(55, DIALOG_DETAILS.paddingTop, 'gb-font', BATTLE_MENU_OPTIONS.FIGHT, 40),
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

    this.#moveSelectionSubBattleMenuPhaserContainerGameObject = this.#scene.add.container(0, DIALOG_DETAILS.y, [
      this.#scene.add.bitmapText(55, DIALOG_DETAILS.paddingTop, 'gb-font', attackNames[0], 30),
      this.#scene.add.bitmapText(350, DIALOG_DETAILS.paddingTop, 'gb-font', attackNames[1], 30),
      this.#scene.add.bitmapText(55, 110, 'gb-font', attackNames[2], 30),
      this.#scene.add.bitmapText(350, 110, 'gb-font', attackNames[3], 30),
      this.#attackCursorPhaserImageGameObject
    ])

    this.hideMonAttackSubMenu()
  }

  #createMainInfoPane () {
    return this.#scene.add.image(0, DIALOG_DETAILS.y, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
  }

  #createMainInfoSubPane () {
    return this.#scene.add.image(0, 0, BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND).setOrigin(0)
  }

  /**
   * 
   * @param {import('../../../types/direction.js').Direction} direction
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
   * @param {import('../../../types/direction.js').Direction} direction
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
    this.#waitingForPlayerInput = false
    this.hideInputCursor()
    this.hideMonAttackSubMenu()
    this.hideItemMenu()
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
      this.showItemMenu()
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.PKMN) {
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_PKMN
      this.updateInfoPanelMessagesAndWaitForInput(['You can\'t switch!'], () => {
        this.#switchToMainBattleMenu()
      }, SKIP_ANIMATIONS)
      return
    }

    if (this.#selectedBattleMenuOption === BATTLE_MENU_OPTIONS.RUN) {
      this.#activeBattleMenu = ACTIVE_BATTLE_MENU.BATTLE_RUN
      this.#scene.events.emit(EVENT_KEYS.BATTLE_RUN_ATTEMPT)
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


  #createPlayerInputCursor () {
    this.#userInputCursorPhaserGameImageObject = this.#scene.add.image(0, 0, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setAngle(90)
    this.#userInputCursorPhaserGameImageObject.setAlpha(0)

    this.#userInputCursorPhaserTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      y: {
        from: PLAYER_INPUT_CURSOR_POS.y,
        to: PLAYER_INPUT_CURSOR_POS.y + 6
      },
      targets: this.#userInputCursorPhaserGameImageObject
    })
    this.#userInputCursorPhaserTween.pause()
  }

  #createBattleDialogTextGameObjects () {
    const maxTextWidth = DIALOG_DETAILS.maxTextWidth(this.#scene.scale.width)
    this.#battleTextGameObjectLine1 = this.#scene.add.bitmapText(DIALOG_DETAILS.paddingLeft, DIALOG_DETAILS.y + DIALOG_DETAILS.paddingTop, 'gb-font', '', 30).setMaxWidth(maxTextWidth)
    this.#battleTextGameObjectLine2 = this.#scene.add.bitmapText(DIALOG_DETAILS.paddingLeft, DIALOG_DETAILS.y + 100, 'gb-font', '', 30).setMaxWidth(maxTextWidth)
  }
}