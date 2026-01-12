import { SKIP_BATTLE_ANIMATIONS } from '../../../config.js'
import { PARTY_MON_SPRITES, UI_ASSET_KEYS } from '../../assets/asset-keys.js'
import { SCENE_KEYS } from '../../scenes/scene-keys.js'
import { DIRECTION } from '../../types/direction.js'
import { ITEM_TYPE_KEY } from '../../types/items.js'
import { getMonStats } from '../../utils/battle-utils.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../../utils/data-manager.js'
import { DataUtils } from '../../utils/data-utils.js'
import { playItemEffect } from '../../utils/item-manager.js'
import { StateMachine } from '../../utils/state-machine.js'
import { DialogUi } from '../dialog-ui.js'
import { HealthBar } from '../health-bar.js'
import { ItemMenu } from '../item-menu.js'
import { PartyMon } from './party-mon.js'

/** @enum {object} */
const SELECTED_MON_MENU_OPTIONS = Object.freeze({
  SUMMARY: 'SUMMARY',
  SWITCH: 'SWITCH',
  ITEM: 'ITEM',
  CANCEL: 'CANCEL'
})

/** @enum {object} */
const PARTY_STATES = Object.freeze({
  HIDDEN: 'HIDDEN',
  WAIT_FOR_MON_SELECT: 'WAIT_FOR_MON_SELECT',
  MON_SELECTED: 'MON_SELECTED',
  WAIT_FOR_MON_OPTION_SELECT: 'WAIT_FOR_MON_OPTION_SELECT',
  SWITCH_MON: 'SWITCH_MON',
  POST_SWITCH: 'POST_SWITCH',
  WAIT_FOR_ITEM_SELECTION: 'WAIT_FOR_ITEM_SELECTION',
  POST_ITEM_USED: 'POST_ITEM_USED'
})

export class PartyMenu {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {import('../../types/typedef.js').Mon[]} */
  #playersMons
  /** @type {DialogUi} */
  #dialogUi
  /** @type {Phaser.GameObjects.Image} */
  #phaserUserInputCursorGameObject
  /** @type {Phaser.Tweens.Tween} */
  #phaserUserInputCursorTween
  /** @type {number} */
  #cursorIndex
  /** @type {PartyMon} */
  #selectedMon
  /** @type {number} */
  #selectedMonIndex
  /** @type {Phaser.GameObjects.Image} */
  #phaserSelectedMonPlaceholderCursorGameObject
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {boolean} */
  #isVisible
  /** @type {Phaser.GameObjects.Container} */
  #phaserSelectedMonMenuGameObject
  /** @type {StateMachine} */
  #partyStateMachine
  /** @type {SELECTED_MON_MENU_OPTIONS[]} */
  #availableSelectedMonOptions
  /** @type {string} */
  #sceneKey
  /** @type {ItemMenu} */
  #itemMenu
  /** @type {() => void} */
  #dialogWaitingForInputCallback
  /** @type {boolean} */
  #inputLocked
  /** @type {PartyMon[]} */
  #partyMons
  /** @type {boolean} */
  #selectOnlyMode

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#sceneKey = this.#scene.scene.key
  
    this.#selectedMon = null
    this.#cursorIndex = 0
    this.#selectedMonIndex = 0
    this.#isVisible = false
    this.#dialogWaitingForInputCallback = undefined
    this.#inputLocked = false
    this.#partyMons = []
    this.#selectOnlyMode = false
  
    this.#playersMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)

    this.#createPartyMons()
    this.#determineAvailableSelectedMonOptions()
    this.#createPartyMonScreen()

    this.#createPlayerInputCursor()
    this.#createSelectedMonCursor()
    this.#createSelectedMonMenu()
    this.#createPartyStateMachine()
    this.#dialogUi = new DialogUi(this.#scene)
    this.#itemMenu = new ItemMenu(this.#scene)

    this.hide()
  }

  /**
   * @returns {boolean}
   */
  get isVisible () {
    return this.#isVisible
  }

  /**
   * @returns {PartyMon}
   */
  get selectedMon () {
    return this.#selectedMon
  }

  /**
   * @param {boolean} val
   */
  set selectOnlyMode (val) {
    this.#selectOnlyMode = val
  }

  /**
   * 
   * @param {import('../../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #unsupportedInput (input) {
    return input === DIRECTION.NONE || input === DIRECTION.LEFT || input === DIRECTION.RIGHT
  }

  #moveCursorDown () {
    let availableOptionsLen = this.#playersMons.length
    this.#cursorIndex += 1

    if (this.#partyStateMachine.currentStateName === PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT) {
      availableOptionsLen = Object.keys(SELECTED_MON_MENU_OPTIONS).length
    }

    if (this.#cursorIndex > availableOptionsLen - 1) {
      this.#cursorIndex = 0
    }
    this.#movePlayerInputCursor()
  }

  #moveCursorUp () {
    let availableOptionsLen = this.#playersMons.length
    this.#cursorIndex -= 1

    if (this.#partyStateMachine.currentStateName === PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT) {
      availableOptionsLen = Object.keys(SELECTED_MON_MENU_OPTIONS).length
    }

    if (this.#cursorIndex < 0) {
      this.#cursorIndex = availableOptionsLen - 1
    }
    this.#movePlayerInputCursor()
  }


  #movePlayerInputCursor () {
    const { x, y } = this.#getCameraPosition()
    let newY = y + (this.#cursorIndex * 65) + 18
    if (this.#partyStateMachine.currentStateName === PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT) {
      newY = y + (this.#cursorIndex * 50) + 185
    }
    this.#phaserUserInputCursorGameObject.setPosition(
      this.#phaserUserInputCursorGameObject.x,
      newY
    )
  }

  /**
   * 
   * @param {import('../../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  handlePlayerInput (input) {
    const state = this.#partyStateMachine.currentStateName

    if (this.#inputLocked || this.#unsupportedInput(input)) {
      return
    }

    if (state === PARTY_STATES.WAIT_FOR_ITEM_SELECTION) {
      this.#handleItemMenuInteraction(input)
      return
    }

    if (input === DIRECTION.UP) {
      this.#moveCursorUp()
      return
    }

    if (input === DIRECTION.DOWN) {
      this.#moveCursorDown()
      return
    }

    if (state === PARTY_STATES.WAIT_FOR_MON_SELECT) {
      this.#handleFirstMonInput(input)
      return
    }

    if (state === PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT) {
      this.#handleMonSelectedMenuInput(input)
      return
    }

    if (state === PARTY_STATES.SWITCH_MON) {
      this.#handleSecondMonInput(input)
      return
    }
  }

  #handleItemMenuInteraction (input) {
    if ((input === 'OK' || input === 'CANCEL') && this.#dialogWaitingForInputCallback) {
      this.#dialogWaitingForInputCallback()
      this.#dialogWaitingForInputCallback = undefined
      return
    }

    if (input === 'CANCEL') {
      this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT)
      return
    }

    this.#itemMenu.handlePlayerInput(input)
    if (input === 'OK' && this.#itemMenu.selectedItemOption) {
      this.#applyItemToSelectedMon(this.#itemMenu.selectedItemOption)
      return
    }
  }

  /**
   * 
   * @param {import('../../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleFirstMonInput (input) {
    if (input === 'OK') {
      this.#partyStateMachine.setState(PARTY_STATES.MON_SELECTED)
      return
    }
    if (input === 'CANCEL') {
      this.hide()
      return
    }
  }

  /**
   * 
   * @param {import('../../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleMonSelectedMenuInput (input) {
    if (input === 'OK') {
      const selection = this.#availableSelectedMonOptions[this.#cursorIndex]
      switch (selection) {
        case SELECTED_MON_MENU_OPTIONS.SUMMARY:
          break
        case SELECTED_MON_MENU_OPTIONS.ITEM:
          this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_ITEM_SELECTION)
          break
        case SELECTED_MON_MENU_OPTIONS.SWITCH:
          this.#partyStateMachine.setState(PARTY_STATES.SWITCH_MON)
          break
        case SELECTED_MON_MENU_OPTIONS.CANCEL:
          this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
          break
      }
      return
    }
    if (input === 'CANCEL') {
      this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
      return
    }
  }

  /**
   * 
   * @param {import('../../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleSecondMonInput (input) {
    const selectingSameMon = this.#cursorIndex === this.#selectedMonIndex
    if (input === 'OK') {
      if (selectingSameMon) {
        this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
        return
      }

      this.#partyStateMachine.setState(PARTY_STATES.POST_SWITCH)
      return
    }

    if (input === 'CANCEL') {
      this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
      return
    }
  }
  
  /**
   * 
   * @param {() => void} callback 
   */
  #playMonSwitchAnimation (callback) {
    this.#scene.time.delayedCall(100, () => {
      const firstMonGameObject = this.#partyMons[this.#cursorIndex].container
      const secondMonGameObject = this.#partyMons[this.#selectedMonIndex].container
      
      let completed = 0
      const onDone = () => {
        completed++
        if (completed === 2) {
          callback()
        }
      }
      this.#scene.add.tween({
        delay: 0,
        duration: 300,
        y: {
          from: firstMonGameObject.y,
          to: secondMonGameObject.y
        },
        targets: firstMonGameObject,
        onComplete: onDone
      })

      this.#scene.add.tween({
        delay: 0,
        duration: 300,
        y: {
          from: secondMonGameObject.y,
          to: firstMonGameObject.y
        },
        targets: secondMonGameObject,
        onComplete: onDone
      })
    })
  }

  #switchAndSaveMons () {
    const firstMonGameObject = this.#partyMons[this.#cursorIndex]
    const secondMonGameObject = this.#partyMons[this.#selectedMonIndex]

    const mon1 = this.#playersMons[this.#selectedMonIndex]
    const mon2 = this.#playersMons[this.#cursorIndex]
    
    this.#partyMons[this.#cursorIndex] = secondMonGameObject
    this.#partyMons[this.#selectedMonIndex] = firstMonGameObject
    
    this.#playersMons[this.#cursorIndex] = mon1
    this.#playersMons[this.#selectedMonIndex] = mon2
    
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, this.#playersMons)
    dataManager.saveData()
  }

  #createSelectedMonCursor () {
    const { x, y } = this.#getCameraPosition()
    this.#phaserSelectedMonPlaceholderCursorGameObject = this.#scene.add.image(x + 15, y + 18, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25).setOrigin(0)
    this.#phaserSelectedMonPlaceholderCursorGameObject.setAlpha(0)
  }

  #createPlayerInputCursor () {
    this.#phaserUserInputCursorGameObject = this.#scene.add.image(0, 0, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25).setOrigin(0)
    this.#phaserUserInputCursorGameObject.setAlpha(0).setDepth(2)

    this.#phaserUserInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: 0,
        to: 0
      },
      targets: this.#phaserUserInputCursorGameObject
    })
    this.#phaserUserInputCursorTween.pause()
  }

  #createPartyMonScreen () {
    this.#container = this.#scene.add.container(0, 0, [
      this.#scene.add.rectangle(0, 0, 640, 576, 0xffffff).setOrigin(0)
    ])
    this.#partyMons.forEach((mon, i) => {
      const offsetY = i * 65
      mon.container.setPosition(50, offsetY).setAlpha(1)
      this.#container.add(mon.container)
      
    })
  }

  #getCameraPosition () {
    const { left, top } = this.#scene.cameras.main.worldView
    return { x: left, y: top}
  }

  show () {
    this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
  }

  hide () {
    this.#partyStateMachine.setState(PARTY_STATES.HIDDEN)
  }

  #createSelectedMonMenu () {
    const g = this.#scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(0, 0, 235, 210)
    g.lineStyle(4, 0x000000, 1)
    g.strokeRect(0, 0, 235, 210)

    this.#phaserSelectedMonMenuGameObject = this.#scene.add.container(0, 0, [
      g,
      this.#scene.add.bitmapText(40, 10, 'gb-font', SELECTED_MON_MENU_OPTIONS.SUMMARY, 40).setOrigin(0),
      this.#scene.add.bitmapText(40, 60, 'gb-font', SELECTED_MON_MENU_OPTIONS.SWITCH, 40).setOrigin(0),
      this.#scene.add.bitmapText(40, 110, 'gb-font', SELECTED_MON_MENU_OPTIONS.ITEM, 40).setOrigin(0),
      this.#scene.add.bitmapText(40, 160, 'gb-font', SELECTED_MON_MENU_OPTIONS.CANCEL, 40).setOrigin(0)
    ])
  }

  #setCursorToPartySelect () {
    const { x, y } = this.#getCameraPosition()
    const startX = x + 15
    this.#phaserUserInputCursorGameObject.setPosition(startX, y + 18)

    this.#phaserUserInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: startX,
        to: startX + 6
      },
      targets: this.#phaserUserInputCursorGameObject
    })
    this.#phaserUserInputCursorTween.restart()
  }

  #setCursorToMonMenu () {
    const { x, y } = this.#getCameraPosition()
    const startX = x + 400
    this.#phaserUserInputCursorGameObject.setPosition(startX, y + 185)

    this.#phaserUserInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: startX,
        to: startX + 6
      },
      targets: this.#phaserUserInputCursorGameObject
    })
    this.#phaserUserInputCursorTween.restart()
  }

  /**
   * 
   * @param {import('../../types/typedef.js').Item} item 
   */
  #applyItemToSelectedMon (item) {
    this.#inputLocked = true
    this.#itemMenu.hide()
    this.#phaserSelectedMonMenuGameObject.setAlpha(0)
    this.#phaserUserInputCursorGameObject.setAlpha(0)
    playItemEffect(this.#scene, {
      item,
      mon: this.#selectedMon,
      callback: (res) => {
        const { wasUsed, msg } = res
        this.#inputLocked = false
        this.#dialogUi.showDialogModal([msg])
        this.#dialogWaitingForInputCallback = () => {
          this.#dialogUi.showDialogModal([` `])
          if (!wasUsed) {
            this.#itemMenu.show()
            return
          }
          this.#phaserUserInputCursorGameObject.setAlpha(1)
          this.#phaserSelectedMonMenuGameObject.setAlpha(1)
          this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT)
        }
      }
    })
  }

  #createPartyStateMachine () {
    this.#partyStateMachine = new StateMachine('party', this)
  
    this.#partyStateMachine.addState({
      name: PARTY_STATES.HIDDEN,
      onEnter: () => {
        this.#container.setAlpha(0)
        this.#phaserUserInputCursorTween.pause()
        this.#phaserUserInputCursorGameObject.setAlpha(0)
        this.#phaserSelectedMonPlaceholderCursorGameObject.setAlpha(0)

        this.#dialogUi.hideDialogModal()
        this.#selectedMon = null
        this.#selectedMonIndex = 0
        this.#cursorIndex = 0
        this.#phaserSelectedMonMenuGameObject.setAlpha(0)

        this.#isVisible = false
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.WAIT_FOR_MON_SELECT,
      onEnter: () => {

        const { x, y } = this.#getCameraPosition()

        this.#container.setPosition(x, y)
        this.#container.setAlpha(1)
        this.#phaserSelectedMonMenuGameObject.setAlpha(0)

        this.#phaserSelectedMonPlaceholderCursorGameObject.setAlpha(0)
        this.#phaserUserInputCursorGameObject.setAlpha(1)
        this.#setCursorToPartySelect()
    
        this.#selectedMon = null
        this.#selectedMonIndex = 0
        this.#cursorIndex = 0
    
        this.#isVisible = true
        this.#dialogUi.showDialogModal(['Choose a POKEMON.'])
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.MON_SELECTED,
      onEnter: () => {
        const { x, y } = this.#getCameraPosition()
        this.#selectedMon = this.#partyMons[this.#cursorIndex]
        this.#selectedMonIndex = this.#cursorIndex

        if (this.#selectOnlyMode) {
          return
        }

        this.#phaserSelectedMonPlaceholderCursorGameObject.setPosition(this.#phaserUserInputCursorGameObject.x, this.#phaserUserInputCursorGameObject.y)
        this.#phaserSelectedMonPlaceholderCursorGameObject.setAlpha(0.5)
        this.#cursorIndex = 0
        
        this.#phaserSelectedMonMenuGameObject.setAlpha(1)
        this.#phaserSelectedMonMenuGameObject.setPosition(x + 390, y + 170)
        this.#setCursorToMonMenu()

        this.#scene.time.delayedCall(100, () => {
          this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT)
        })
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.WAIT_FOR_MON_OPTION_SELECT,
      onEnter: () => {
        this.#itemMenu.hide()
        this.#dialogUi.showDialogModal([`Select an option for ${this.#selectedMon.name}. `])
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.SWITCH_MON,
      onEnter: () => {
        this.#setCursorToPartySelect()
        this.#movePlayerInputCursor()

        this.#phaserSelectedMonMenuGameObject.setAlpha(0)
        
        this.#dialogUi.showDialogModal(['Now choose a POKEMON to switch.'])
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.POST_SWITCH,
      onEnter: () => {
        this.#inputLocked = true
        this.#switchAndSaveMons()
        this.#playMonSwitchAnimation(() => {
          this.#inputLocked = false
          this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
        })
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.WAIT_FOR_ITEM_SELECTION,
      onEnter: () => {
        this.#itemMenu.show()
        this.#dialogUi.showDialogModal([' '])
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.POST_ITEM_USED,
      onEnter: () => {
        this.#setCursorToMonMenu()
        this.#itemMenu.hide()
      }
    })
  }

  #determineAvailableSelectedMonOptions () {
    this.#availableSelectedMonOptions = [
      SELECTED_MON_MENU_OPTIONS.SWITCH,
      SELECTED_MON_MENU_OPTIONS.ITEM,
      SELECTED_MON_MENU_OPTIONS.CANCEL
    ]

    if (this.#sceneKey === SCENE_KEYS.WORLD_SCENE) {
      this.#availableSelectedMonOptions.unshift(SELECTED_MON_MENU_OPTIONS.SUMMARY)
    }
  }

  #createPartyMons () {
    this.#playersMons.forEach(mon => {
      this.#partyMons.push(
        new PartyMon(this.#scene, mon)
      )
    })
  }
}