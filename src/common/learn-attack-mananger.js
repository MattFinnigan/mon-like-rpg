import Phaser from '../lib/phaser.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { DataUtils } from '../utils/data-utils.js'

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

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
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
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction | 'OK' | 'CANCEL'} input
   */
  handlePlayerInput (input) {
    if (!this.#waitForMoveLearnedConfirm && !this.#waitForOverrideOrNot && !this.#waitForOverrideChoice) {
      return
    }

    if (this.#waitForMoveLearnedConfirm && (input === 'CANCEL' || input === 'OK')) {
      this.#reset()
      return
    }

    // if (this.#waitForOverrideOrNot || this.#waitForOverrideChoice) {
    //   
    // }
  }

  /**
   * @param {import('../types/typedef.js').Mon} mon
   * @param {(msgs: string[], newAttkId: import('../types/typedef.js').Attack|null) => void} callback
   */
  checkMonHasNewMoveToLearn (mon, callback) {
    const learnableMoves = DataUtils.getMonLearnableMoves(this.#scene, mon.baseMonIndex, mon.currentLevel)
      .filter(attk => {
        return !mon.attackIds.includes(attk)
      })

    if (learnableMoves.length) {
      // assume only 1 new move is learnable per level
      this.#learningNewAttack = DataUtils.getMonAttack(this.#scene, learnableMoves[0])
      this.#currentMon = mon
      this.#startLearnMoveSequence(callback)
      return
    }
    callback([], null)
  }

  /**
   * @param {(msgs: string[], newAttkId: import('../types/typedef.js').Attack|null) => void} callback
   */
  #startLearnMoveSequence (callback) {
    const msgs = []
    if (this.#currentMon.attackIds.length === 4) {
      // todo override attack etc
      this.#waitForMoveLearnedConfirm = true
      msgs.push`${this.#currentMon.name} tried to learn ${this.#learningNewAttack.name}`
      callback(msgs, null)
    }
    
    const partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS).map(mon => {
      if (mon.id === this.#currentMon.id) {
        mon.attackIds.push(this.#learningNewAttack.id)
      }
      return mon
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, partyMons)
    dataManager.saveData()

    // this.#waitForMoveLearnedConfirm = true
    msgs.push(`${this.#currentMon.name} learned ${this.#learningNewAttack.name}!`)
    callback(msgs, this.#learningNewAttack)
  }
}
