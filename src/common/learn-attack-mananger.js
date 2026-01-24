import { SFX_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { DIALOG_DETAILS } from '../types/dialog-ui.js'
import { DIRECTION } from '../types/direction.js'
import { AudioManager } from '../utils/audio-manager.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { DataUtils } from '../utils/data-utils.js'
import { DialogUi } from './dialog-ui.js'

export class LearnAttackManager {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {import('../types/typedef.js').Mon} */
  #currentMon
  /** @type {import('../types/typedef.js').Attack} */
  #learningNewAttack
  /** @type {boolean} */
  #waitForMoveLearnedConfirm
  /** @type {boolean} */
  #waitForOverrideOrNot
  /** @type {boolean} */
  #waitForOverrideChoice
  /** @type {DialogUi} */
  #dialogUi
  /** @type {Phaser.GameObjects.Container} */
  #phaserMoveReplaceContainer
  /** @type {Phaser.GameObjects.Image} */
  #replaceMoveCursor
  /** @type {number} */
  #replaceMoveIndex
  /** @type {(newAttackIds: number[]) => void} */
  #onReplaceMove
  /** @type {Phaser.Tweens.Tween} */
  #replaceMoveCursorTween
  /** @type {AudioManager} */
  #audioManager

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#dialogUi = new DialogUi(this.#scene, ['YES', 'NO'])
    this.#reset()
  }

  /**
   * @returns {import('../types/typedef.js').Attack|null}
   */
  get learningNewAttack () {
    return this.#learningNewAttack
  }

  #reset () {
    this.#currentMon = null
    this.#learningNewAttack = null
    this.#waitForMoveLearnedConfirm = false
    this.#waitForOverrideOrNot = false
    this.#waitForOverrideChoice = false
    this.#replaceMoveIndex = 0
    this.#onReplaceMove = undefined
    this.#audioManager = this.#scene.registry.get('audio')
    this.#dialogUi.hideDialogModal()
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  handlePlayerInput (input) {
    if (!this.#waitForMoveLearnedConfirm && !this.#waitForOverrideOrNot && !this.#waitForOverrideChoice) {
      return
    }

    if (this.#waitForOverrideOrNot) {
      if (input === DIRECTION.UP || input === DIRECTION.DOWN) {
        this.#dialogUi.moveOptionsCursor(input)
        return
      }

      if (input === 'OK') {
        if (this.#dialogUi.isWaitingOnOptionSelect) {
          this.#dialogUi.selectCurrentOption()
          return
        }
        this.#dialogUi.showNextMessage()
      }
      return
    }

    if (this.#waitForOverrideChoice) {
      if (input === DIRECTION.UP || input === DIRECTION.DOWN) {
        this.#moveReplaceMoveCursor(input)
        return
      }

      if (input === 'OK') {
        this.#learnMove(this.#onReplaceMove, true)
        return
      }

      if (input === 'CANCEL') {
        this.#cancelReplaceMove(this.#onReplaceMove)
        return
      }
      return
    }

    if (this.#waitForMoveLearnedConfirm && (input === 'CANCEL' || input === 'OK')) {
      this.#dialogUi.showNextMessage()
      return
    }
  }

  /**
   * @param {import('../types/typedef.js').Mon} mon
   * @param {(newAttackIds: number[]) => void} callback
   */
  checkMonHasNewMoveToLearn (mon, callback) {
    const learnableMoves = DataUtils.getMonLearnableMoves(this.#scene, mon.baseMonIndex, mon.currentLevel).filter(attk => !mon.attackIds.includes(attk))

    if (learnableMoves.length) {
      // assume only 1 new move is learnable per level
      this.#learningNewAttack = DataUtils.getMonAttack(this.#scene, learnableMoves[0])
      this.#currentMon = mon
      this.#startLearnMoveSequence(callback)
      return
    }
    callback(null)
  }

  /**
   * @param {(newAttackIds: number[]|null) => void} callback
   */
  #startLearnMoveSequence (callback) {
    if (this.#currentMon.attackIds.length === 4) {
      this.#waitForOverrideOrNot = true
      const msgs = [
        `${this.#currentMon.name} wants to learn ${this.#learningNewAttack.name}`,
        `But it only has room for 4 moves`,
        `Do you want to replace a move with ${this.#learningNewAttack.name}?`
      ]
      this.#dialogUi.showDialogModalAndWaitForOptionSelect(msgs, (choice) => {
        this.#waitForOverrideOrNot = false
        if (choice === 'YES') {
          this.#startReplaceMoveSequence(callback)
          return
        }
        this.#cancelReplaceMove(callback)
      })
      return
    }
    this.#learnMove(callback)
  }

  /**
   * @param {(newAttackIds: number[]) => void} callback
   * @param {boolean} [replaceMove=false]
   */
  #learnMove (callback, replaceMove = false) {
    if (this.#phaserMoveReplaceContainer) {
      this.#phaserMoveReplaceContainer.setAlpha(0)
    }

    this.#waitForOverrideChoice = false
    this.#waitForOverrideOrNot = false

    const msgs = []
    let newAttackIds = []
    const partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS).map(mon => {
      if (mon.id === this.#currentMon.id) {
        if (replaceMove) {
          mon.attackIds[this.#replaceMoveIndex] = this.#learningNewAttack.id
          newAttackIds = mon.attackIds
          return mon
        }
        mon.attackIds.push(this.#learningNewAttack.id)
        newAttackIds = mon.attackIds
      }
      return mon
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, partyMons)
    dataManager.saveData()

    this.#waitForMoveLearnedConfirm = true
    msgs.push(`${this.#currentMon.name} learned ${this.#learningNewAttack.name}!`)
    
    this.#audioManager.playSfx(SFX_ASSET_KEYS.ITEM_OBTAINED, { primaryAudio: true })

    this.#dialogUi.showDialogModalAndWaitForInput(msgs, () => {
      this.#reset()
      callback(newAttackIds)
    })
  }

  /**
   * @param {(newAttackIds: number[]) => void} callback
   */
  #startReplaceMoveSequence (callback) {
    this.#dialogUi.showDialogModalNoInputRequired(['Which move would you like to replace?'])

    this.#createMoveReplaceContainer()
    this.#replaceMoveCursorTween.restart()
    this.#waitForOverrideChoice = true
    this.#phaserMoveReplaceContainer.setAlpha(1)
    this.#replaceMoveIndex = 0
    this.#onReplaceMove = callback
  }

  #createMoveReplaceContainer () {
    const containerWidth = 400
    const containerHeight = 210

    const containerX = this.#scene.scale.width - 4 - containerWidth
    const containerY = DIALOG_DETAILS.y - containerHeight

    const g = this.#scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(0, 0, containerWidth, containerHeight)
    g.lineStyle(4, 0x000000, 1)
    g.strokeRect(0, 0, containerWidth, containerHeight)

    const options = this.#currentMon.attackIds.map((attkId, i) => {
      const attk = DataUtils.getMonAttack(this.#scene, attkId)
      return this.#scene.add.bitmapText(40, 10 + (50 * i), 'gb-font', attk.name, 40).setOrigin(0).setDepth(2)
    })

    this.#phaserMoveReplaceContainer = this.#scene.add.container(containerX, containerY, [g, ...options]).setDepth(2).setAlpha(0)
    this.#replaceMoveCursor = this.#scene.add.image(10, 20, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setDepth(2)

    this.#replaceMoveCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: 10,
        start: 10,
        to: 16
      },
      targets: this.#replaceMoveCursor
    })
    this.#replaceMoveCursorTween.pause()

    this.#phaserMoveReplaceContainer.add(this.#replaceMoveCursor)
  }

  /**
   * @param {(newAttackIds: number[]) => void} callback
   */
  #cancelReplaceMove (callback) {
    this.#waitForOverrideChoice = false
    this.#waitForOverrideOrNot = false
    this.#waitForMoveLearnedConfirm = true
    if (this.#phaserMoveReplaceContainer) {
      this.#phaserMoveReplaceContainer.setAlpha(0)
    }
    this.#dialogUi.showDialogModalNoInputRequired([`${this.#currentMon.name} did not learn ${this.#learningNewAttack.name}`])
    this.#scene.time.delayedCall(1000, () => {
      callback(null)
      this.#reset()
    })
  }

  /**
   * 
   * @param {import("../types/direction.js").Direction} direction 
   */
  #moveReplaceMoveCursor (direction) {
    if (direction === DIRECTION.DOWN) {
      this.#moveCursorDown()
      return
    }
    if (direction === DIRECTION.UP) {
      this.#moveCursorUp()
      return
    }
  }

  #moveCursorDown () {
    let availableOptionsLen = this.#currentMon.attackIds.length
    this.#replaceMoveIndex += 1

    if (this.#replaceMoveIndex > availableOptionsLen - 1) {
      this.#replaceMoveIndex = 0
    }
    this.#replaceMoveCursor.setPosition(
      this.#replaceMoveCursor.x,
      15 + (50 * this.#replaceMoveIndex) 
    )
  }

  #moveCursorUp () {
    let availableOptionsLen = this.#currentMon.attackIds.length
    this.#replaceMoveIndex -= 1

    if (this.#replaceMoveIndex < 0) {
      this.#replaceMoveIndex = availableOptionsLen - 1
    }
    this.#replaceMoveCursor.setPosition(
      this.#replaceMoveCursor.x,
      15 + (50 * this.#replaceMoveIndex) 
    )
  }

}
