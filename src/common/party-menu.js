import { PARTY_MON_SPRITES, UI_ASSET_KEYS } from '../assets/asset-keys.js'
import { DIRECTION } from '../types/direction.js'
import { getMonStats } from '../utils/battle-utils.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { DataUtils } from '../utils/data-utils.js'
import { DialogUi } from './dialog-ui.js'
import { HealthBar } from './health-bar.js'

/** @enum {object} */
const PARTY_STATES = Object.freeze({
  WAIT_FOR_MON_SELECT: 'WAIT_FOR_MON_SELECT',
  SWITCHING_WAIT_FOR_MON_2_SELECT: 'SWITCHING_WAIT_FOR_MON_2_SELECT',
  SWITCHING_MONS_IN_PROGRESS: 'SWITCHING_MONS_IN_PROGRESS'
})

export class PartyMenu {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {import('../types/typedef.js').Mon[]} */
  #partyMons
  /** @type {Phaser.GameObjects.Container[]} */
  #phaserPartyMonGameObjects
  /** @type {DialogUi} */
  #dialogUi
  /** @type {Phaser.GameObjects.Image} */
  #phaserUserInputCursorGameObject
  /** @type {Phaser.Tweens.Tween} */
  #phaserUserInputCursorTween
  /** @type {number} */
  #currentCursorMonIndex
  /** @type {HealthBar[]} */
  #partyMonHealthBars
  /** @type {import('../types/typedef.js').Mon} */
  #currentMon
  /** @type {number} */
  #currentMonIndex
  /** @type {Phaser.GameObjects.Image} */
  #phaserCurrentMonCursorGameObject
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {boolean} */
  #isVisible
  /** @type {import('../types/typedef.js').Mon} */
  #monToSwitchWith
  /** @type {boolean} */
  #animating

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene

    this.#currentMon = null
    this.#currentCursorMonIndex = 0
    this.#currentMonIndex = 0
    this.#monToSwitchWith = null
    this.#partyMonHealthBars = []
    this.#phaserPartyMonGameObjects = []
    this.#isVisible = false

    this.#getPartyMonsDetailsFromStore()
    this.#createPartyMonGameObjects()
    this.#createPlayerInputCursor()
    this.#createCurrentMonCursor()

    this.#dialogUi = new DialogUi(this.#scene)
    this.hide()
  }

  /**
   * @returns {boolean}
   */
  get isVisible () {
    return this.#isVisible
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #unsupportedInput (input) {
    return input === DIRECTION.NONE || input === DIRECTION.LEFT || input === DIRECTION.RIGHT
  }

  #moveCursorUp () {
    this.#currentCursorMonIndex += 1

    if (this.#currentCursorMonIndex > this.#partyMons.length - 1) {
      this.#currentCursorMonIndex = 0
    }
    this.#movePlayerInputCursor()
  }

  #moveCursorDown () {
    this.#currentCursorMonIndex -= 1

    if (this.#currentCursorMonIndex < 0) {
      this.#currentCursorMonIndex = this.#partyMons.length - 1
    }
    this.#movePlayerInputCursor()
  }


  #movePlayerInputCursor () {
    const { x, y } = this.#getCameraPosition()

    const newY = y + (this.#currentCursorMonIndex * 65) + 18
    this.#phaserUserInputCursorGameObject.setPosition(
      this.#phaserUserInputCursorGameObject.x,
      newY
    )
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  handlePlayerInput (input) {
    if (this.#animating) {
      return
    }

    if (this.#unsupportedInput(input)) {
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

    if (!this.#currentMon) {
      this.#handleFirstMonInput(input)
      return
    }

    if (this.#currentMon) {
      this.#handleSecondMonInput(input)
      return
    }
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleSecondMonInput (input) {
    const selectingSameMon = this.#currentCursorMonIndex === this.#currentMonIndex
    if (input === 'OK') {
      if (selectingSameMon) {
        this.#resetMonSelectionState()
        return
      }

      this.#switchAndSaveMons()
      this.#playMonSwitchAnimation(() => {
        this.#resetUserInputCursorObjects()
        this.#resetMonSelectionState()
      })
      return
    }

    if (input === 'CANCEL') {
      this.#resetMonSelectionState()
      return
    }
  }
  
  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleFirstMonInput (input) {
    if (input === 'OK') {
      this.#selectMon()
      return
    }
    if (input === 'CANCEL') {
      this.hide()
      return
    }
  }

  #resetMonSelectionState () {
    this.#currentMon = null
    this.#currentMonIndex = 0
    this.#dialogUi.showDialogModal(['Choose a POKEMON.'])
  }

  #resetUserInputCursorObjects () {
    this.#phaserCurrentMonCursorGameObject.setAlpha(0)
    this.#phaserUserInputCursorGameObject.setAlpha(1)
    this.#phaserUserInputCursorTween.restart()
  }

  #selectMon () {
    this.#currentMon = this.#partyMons[this.#currentCursorMonIndex]
    this.#currentMonIndex = this.#currentCursorMonIndex

    // todo would open a menu when more options available
    this.#phaserCurrentMonCursorGameObject.setPosition(this.#phaserUserInputCursorGameObject.x, this.#phaserUserInputCursorGameObject.y)
    this.#phaserCurrentMonCursorGameObject.setAlpha(0.5)

    this.#dialogUi.showDialogModal(['Now choose a POKEMON to switch.'])
  }
  
  /**
   * 
   * @param {() => void} callback 
   */
  #playMonSwitchAnimation (callback) {
    this.#animating = true
    this.#scene.time.delayedCall(100, () => {
      const firstMonGameObject = this.#phaserPartyMonGameObjects[this.#currentCursorMonIndex]
      const secondMonGameObject = this.#phaserPartyMonGameObjects[this.#currentMonIndex]
      
      let completed = 0
      const onDone = () => {
        completed++
        if (completed === 2) {
          this.#animating = false
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
    const firstMonGameObject = this.#phaserPartyMonGameObjects[this.#currentCursorMonIndex]
    const secondMonGameObject = this.#phaserPartyMonGameObjects[this.#currentMonIndex]

    const mon1 = this.#partyMons[this.#currentMonIndex]
    const mon2 = this.#partyMons[this.#currentCursorMonIndex]
    
    this.#phaserPartyMonGameObjects[this.#currentCursorMonIndex] = secondMonGameObject
    this.#phaserPartyMonGameObjects[this.#currentMonIndex] = firstMonGameObject
    
    this.#partyMons[this.#currentCursorMonIndex] = mon1
    this.#partyMons[this.#currentMonIndex] = mon2
    
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, this.#partyMons)
    dataManager.saveData()
  }

  #createCurrentMonCursor () {
    const { x, y } = this.#getCameraPosition()
    this.#phaserCurrentMonCursorGameObject = this.#scene.add.image(x + 15, y + 18, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25).setOrigin(0)
    this.#phaserCurrentMonCursorGameObject.setAlpha(0)
  }

  #createPlayerInputCursor () {
    const { x, y } = this.#getCameraPosition()

    this.#phaserUserInputCursorGameObject = this.#scene.add.image(x + 15, y + 18, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25).setOrigin(0)
    this.#phaserUserInputCursorGameObject.setAlpha(0)

    this.#phaserUserInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: x + 15,
        to: x + 21
      },
      targets: this.#phaserUserInputCursorGameObject
    })
    this.#phaserUserInputCursorTween.pause()
  }

  #createPartyMonGameObjects () {
    this.#container = this.#scene.add.container(0, 0, [
      this.#scene.add.rectangle(0, 0, 640, 576, 0xffffff).setOrigin(0)
    ])
    this.#partyMons.forEach((mon, i) => {
      const offsetY = i * 65
      const baseMon = DataUtils.getBaseMonDetails(this.#scene, mon.baseMonIndex)
      const monStats = getMonStats(baseMon, mon)
      const hpBar = new HealthBar(this.#scene, 117, 23, mon.currentHp , monStats.hp, false, 1)
      this.#partyMonHealthBars.push(hpBar)

      const partyMonContainer = this.#scene.add.container(50, offsetY, [
        this.#scene.add.image(25, 5, PARTY_MON_SPRITES.PARTY_MON_SPRITES_SHEET_1, baseMon.partySpriteAssetKey)
          .setScale(1.25),
        this.#scene.add.bitmapText(65, 0, 'gb-font', mon.name, 40).setOrigin(0),
        this.#scene.add.bitmapText(75, 40, 'gb-font-thick', `HP:`, 20).setOrigin(0),
        hpBar.container,
        this.#scene.add.bitmapText(350, 10, 'gb-font-thick', `Lv${mon.currentLevel}`, 30).setOrigin(0),
        this.#scene.add.bitmapText(380, 35, 'gb-font-thick', `${mon.currentHp} / ${monStats.hp}`, 30).setOrigin(0)
      ])
      this.#container.add(partyMonContainer)
      this.#phaserPartyMonGameObjects.push(partyMonContainer)
      
    })
  }

  #getCameraPosition () {
    const { left, top } = this.#scene.cameras.main.worldView
    return { x: left, y: top}
  }

  show () {
    const { x, y } = this.#getCameraPosition()

    this.#container.setPosition(x, y)
    this.#container.setAlpha(1)

    this.#createPlayerInputCursor()
    this.#createCurrentMonCursor()
    
    this.#phaserUserInputCursorGameObject.setAlpha(1)
    this.#phaserUserInputCursorTween.restart()

    this.#dialogUi.showDialogModal(['Choose a POKEMON.'])

    this.#isVisible = true
  }

  hide () {
    this.#container.setAlpha(0)
    this.#phaserUserInputCursorTween.pause()
    this.#phaserUserInputCursorGameObject.setAlpha(0)
    this.#phaserCurrentMonCursorGameObject.setAlpha(0)

    this.#dialogUi.hideDialogModal()
    this.#currentMon = null
    this.#currentCursorMonIndex = 0
    this.#currentMonIndex = 0
    this.#monToSwitchWith = null
    this.#isVisible = false
  }


  #getPartyMonsDetailsFromStore () {
    this.#partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)
  }
}