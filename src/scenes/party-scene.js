import { SKIP_BATTLE_ANIMATIONS } from '../../config.js'
import { HEALTH_BAR_ASSET_KEYS, PARTY_MON_SPRITES, UI_ASSET_KEYS } from '../assets/asset-keys.js'
import { HealthBar } from '../common/health-bar.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from '../scenes/scene-keys.js'
import { getMonStats } from '../utils/battle-utils.js'
import { Controls } from '../utils/controls.js'
import { DataUtils } from '../utils/data-utils.js'
import { StateMachine } from '../utils/state-machine.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { DIRECTION } from '../types/direction.js'
import { DialogUi } from '../common/dialog-ui.js'

/** @enum {object} */
const PARTY_STATES = Object.freeze({
  WAIT_FOR_MON_SELECT: 'WAIT_FOR_MON_SELECT',
  SWITCHING_WAIT_FOR_MON_2_SELECT: 'SWITCHING_WAIT_FOR_MON_2_SELECT',
  SWITCHING_MONS_IN_PROGRESS: 'SWITCHING_MONS_IN_PROGRESS'
})

export class PartyScene extends Phaser.Scene {
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
  /** @type {Controls} */
  #controls
  /** @type {StateMachine} */
  #partyStateMachine
  /** @type {import('../types/typedef.js').Mon} */
  #currentMon
  /** @type {number} */
  #currentMonIndex
  /** @type {Phaser.GameObjects.Image} */
  #phaserCurrentMonCursorGameObject


  constructor () {
    super({
      key: SCENE_KEYS.PARTY_SCENE
    })
  }
  

  preload () {
    console.log(`[${PartyScene.name}:preload] invoked`)
  
    const battleAssetPath = 'assets/images/battle'

    this.load.spritesheet(PARTY_MON_SPRITES.PARTY_MON_SPRITES_SHEET_1, `/assets/images/mons/party/sheet1.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${battleAssetPath}/hp_left_cap.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${battleAssetPath}/hp_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${battleAssetPath}/hp_right_cap.png`)
  }

  create () {
    console.log(`[${PartyScene.name}:create] invoked`)
    this.cameras.main.setBackgroundColor('#fff')

    this.#currentMon = null
    this.#currentCursorMonIndex = 0
    this.#currentMonIndex = 0
    this.#partyMonHealthBars = []
    this.#phaserPartyMonGameObjects = []
    
    this.#getPartyMonsDetailsFromStore()
    this.#createPartyMonGameObjects()
    this.#createPlayerInputCursor()
    this.#createCurrentMonCursor()
    this.#createPartyStateMachine()
    this.#dialogUi = new DialogUi(this)
    this.#controls = new Controls(this)

    this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
  }

  update () {
    if (this.#switchingInProgress()) {
      return
    }
    const selectedDirection = this.#controls.getDirectionKeyJustPressed()

    if (selectedDirection !== DIRECTION.NONE) {
      this.#handlePlayerInput(selectedDirection)
      return
    }
    
    if (this.#controls.wasSpaceKeyPressed()) {
      this.#handlePlayerInput('OK')
      return
    }

    if (this.#controls.wasBackKeyPressed()) {
      this.#handlePlayerInput('CANCEL')
      return
    }
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handlePlayerInput (input) {
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

    if (this.#isWaitingForMonSelect()) {
      this.#handleFirstMonInput(input)
      return
    }

    if (this.#hasSelectedMonToSwitch()) {
      this.#handleSecondMonInput(input)
      return
    }
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleFirstMonInput (input) {
    if (input === 'OK') {
      // TODO replace when other mon interactions are added - open menu
      this.#partyStateMachine.setState(PARTY_STATES.SWITCHING_WAIT_FOR_MON_2_SELECT)
      return
    }
    if (input === 'CANCEL') {
      this.scene.start(SCENE_KEYS.WORLD_SCENE)
      return
    }
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #handleSecondMonInput (input) {
    if (input === 'OK') {
      if (this.#isSelectingSameMon()) {
        this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
        return
      }

      this.#partyStateMachine.setState(PARTY_STATES.SWITCHING_MONS_IN_PROGRESS)
      return
    }

    if (input === 'CANCEL') {
      this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
      return
    }
  }

  /**
   * 
   * @returns {boolean}
   */
  #isSelectingSameMon () {
    return this.#currentCursorMonIndex === this.#currentMonIndex
  }

  /**
   * 
   * @returns {boolean}
   */
  #hasSelectedMonToSwitch () {
    return this.#partyStateMachine.currentStateName === PARTY_STATES.SWITCHING_WAIT_FOR_MON_2_SELECT
  }

  /**
   * 
   * @returns {boolean}
   */
  #switchingInProgress () {
    return this.#partyStateMachine.currentStateName === PARTY_STATES.SWITCHING_MONS_IN_PROGRESS
  }

  /**
   * 
   * @returns {boolean}
   */
  #isWaitingForMonSelect () {
    return this.#partyStateMachine.currentStateName === PARTY_STATES.WAIT_FOR_MON_SELECT
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  #unsupportedInput (input) {
    return input === DIRECTION.NONE || input === DIRECTION.LEFT || input === DIRECTION.RIGHT
  }

  #resetMonSelectionState () {
    this.#currentMon = null
    this.#currentMonIndex = 0
    this.time.delayedCall(100, () => { this.#dialogUi.showDialogModal(['Choose a POKEMON.']) })
  }

  #resetUserInputCursorObjects () {
    this.#phaserCurrentMonCursorGameObject.setAlpha(0)
    this.#phaserUserInputCursorGameObject.setAlpha(1)
    this.#phaserUserInputCursorTween.restart()
  }

  #selectFirstMonForSwitching () {
    this.#currentMon = this.#partyMons[this.#currentCursorMonIndex]
    this.#currentMonIndex = this.#currentCursorMonIndex

    this.#phaserCurrentMonCursorGameObject.setPosition(21, this.#phaserUserInputCursorGameObject.y)
    this.#phaserCurrentMonCursorGameObject.setAlpha(0.5)

    this.#dialogUi.showDialogModal(['Now choose a POKEMON to switch.'])
  }

  #playMonSwitchAnimation () {
    this.time.delayedCall(100, () => {
      const firstMonGameObject = this.#phaserPartyMonGameObjects[this.#currentCursorMonIndex]
      const secondMonGameObject = this.#phaserPartyMonGameObjects[this.#currentMonIndex]
  
      const firstMonPositionY = this.#currentCursorMonIndex * 65
      const secondMonPositionY = this.#currentMonIndex * 65
      
      this.add.tween({
        delay: 0,
        duration: 300,
        y: {
          from: firstMonGameObject.y,
          to: secondMonPositionY
        },
        targets: firstMonGameObject
      })

      this.add.tween({
        delay: 0,
        duration: 300,
        y: {
          from: secondMonGameObject.y,
          to: firstMonPositionY
        },
        targets: secondMonGameObject
      })

      this.#switchAndSaveMons()
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

    this.#partyStateMachine.setState(PARTY_STATES.WAIT_FOR_MON_SELECT)
  }

  #createPartyStateMachine () {
    this.#partyStateMachine = new StateMachine('party', this)

    this.#partyStateMachine.addState({
      name: PARTY_STATES.WAIT_FOR_MON_SELECT,
      onEnter: () => {
        this.#resetUserInputCursorObjects()
        this.#resetMonSelectionState()
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.SWITCHING_WAIT_FOR_MON_2_SELECT,
      onEnter: () => {
        this.#selectFirstMonForSwitching()
      }
    })

    this.#partyStateMachine.addState({
      name: PARTY_STATES.SWITCHING_MONS_IN_PROGRESS,
      onEnter: () => {
        this.#playMonSwitchAnimation()
      }
    })
  }

  #createCurrentMonCursor () {
    this.#phaserCurrentMonCursorGameObject = this.add.image(15, 35, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25)
    this.#phaserCurrentMonCursorGameObject.setAlpha(0)
  }

  #createPlayerInputCursor () {
    this.#phaserUserInputCursorGameObject = this.add.image(15, 35, UI_ASSET_KEYS.CURSOR, 0).setScale(1.25)
    this.#phaserUserInputCursorGameObject.setAlpha(0)

    this.#phaserUserInputCursorTween = this.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: 15,
        to: 21
      },
      targets: this.#phaserUserInputCursorGameObject
    })
    this.#phaserUserInputCursorTween.pause()
  }

  #createPartyMonGameObjects () {
    const container = this.add.container(60, 10, [])
    this.#partyMons.forEach((mon, i) => {
      const offsetY = i * 65
      const baseMon = DataUtils.getBaseMonDetails(this, mon.baseMonIndex)
      const monStats = getMonStats(baseMon, mon)
      const hpBar = new HealthBar(this, 112, 21, mon.currentHp , monStats.hp, false, 1)
      this.#partyMonHealthBars.push(hpBar)

      const partyMonContainer = this.add.container(0, offsetY, [
        this.add.image(0, 0, PARTY_MON_SPRITES.PARTY_MON_SPRITES_SHEET_1, baseMon.partySpriteAssetKey).setScale(1.25),
        this.add.bitmapText(40, -5, 'gb-font', mon.name, 40),
        this.add.bitmapText(70, 35, 'gb-font-thick', `HP:`, 20),
        hpBar.container,
        this.add.bitmapText(350, -5, 'gb-font-thick', `Lv${mon.currentLevel}`, 30),
        this.add.bitmapText(380, 25, 'gb-font-thick', `${mon.currentHp} / ${monStats.hp}`, 30)
      ])
      container.add(partyMonContainer)
      this.#phaserPartyMonGameObjects.push(partyMonContainer)
    })
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
    const newY = (this.#currentCursorMonIndex * 65) + 35
    this.#phaserUserInputCursorGameObject.setPosition(
      this.#phaserUserInputCursorGameObject.x,
      newY
    )
  }

  #getPartyMonsDetailsFromStore () {
    this.#partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)
  }
}