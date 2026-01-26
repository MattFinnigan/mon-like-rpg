import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../types/direction.js'
import { EnemyBattleMon } from '../battle/mons/enemy-battle-monster.js'
import { PlayerBattleMon } from '../battle/mons/player-battle-monster.js'
import { StateMachine } from '../utils/state-machine.js'
import { SKIP_ANIMATIONS } from '../../config.js'
import { ATTACK_TARGET, AttackManager } from '../battle/attacks/attack-manager.js'
import { Controls } from '../utils/controls.js'
import { BattleTrainer } from '../battle/characters/battle-trainer.js'
import { EVENT_KEYS } from '../types/event-keys.js'
import { AudioManager } from '../utils/audio-manager.js'
import { BGM_ASSET_KEYS, SFX_ASSET_KEYS, TRAINER_SPRITES } from '../assets/asset-keys.js'
import { BattlePlayer } from '../battle/characters/battle-player.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { BattleMon } from '../battle/mons/battle-mon.js'
import { ITEM_TYPE_KEY } from '../types/items.js'
import { OPPONENT_TYPES } from '../types/opponent-types.js'
import { playItemEffect } from '../utils/item-manager.js'
import { PartyMon } from '../common/party-menu/party-mon.js'
import { calculateExperienceGained, getMonStats } from '../utils/battle-utils.js'
import { DataUtils } from '../utils/data-utils.js'
import { DialogUi } from '../common/dialog-ui.js'
import { loadBaseMonAssets } from '../utils/load-assets.js'
import { LearnAttackManager } from '../common/learn-attack-mananger.js'
import { STATUS_EFFECT } from '../types/status-effect.js'
import { exhaustiveGuard } from '../utils/guard.js'
import { BGM_ASSETS_PATH} from '../utils/consts.js'


/** @enum {object} */
const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  INTRO_AWAIT_INPUT: 'INTRO_AWAIT_INPUT',
  WILD_MON_OUT: 'WILD_MON_OUT',
  WILD_MON_OUT_AWAIT_INPUT: 'WILD_MON_OUT_AWAIT_INPUT',
  ENEMY_MON_OUT: 'ENEMY_MON_OUT',
  PLAYER_MON_OUT: 'PLAYER_MON_OUT',
  PLAYER_DECISION_AWAIT_INPUT: 'PLAYER_DECISION_AWAIT_INPUT',
  ENEMY_DECISION: 'ENEMY_DECISION',
  BATTLE: 'BATTLE',
  POST_ATTACK_AWAIT_INPUT: 'POST_ATTACK_AWAIT_INPUT',
  FINISHED: 'FINISHED',
  RUN_ATTEMPT_AWAIT_INPUT: 'RUN_ATTEMPT_AWAIT_INPUT',
  ENEMY_CHOOSE_MON: 'ENEMY_CHOOSE_MON',
  PLAYER_CHOOSE_MON: 'PLAYER_CHOOSE_MON',
  PLAYER_VICTORY_AWAIT_INPUT: 'PLAYER_VICTORY_AWAIT_INPUT',
  PLAYER_DEFEATED: 'PLAYER_DEFEATED',
  PLAYER_DEFEATED_AWAIT_INPUT: 'PLAYER_DEFEATED_AWAIT_INPUT',
  ITEM_USED_AWAIT_INPUT: 'ITEM_USED_AWAIT_INPUT',
  PLAYER_SWITCH: 'PLAYER_SWITCH',
  GAIN_EXP: 'GAIN_EXP',
  GAIN_EXP_AWAIT_INPUT: 'GAIN_EXP_AWAIT_INPUT',
  ENEMY_MON_FAINTED: 'ENEMY_MON_FAINTED',
  ENEMY_MON_FAINTED_AWAIT_INPUT: 'ENEMY_MON_FAINTED_AWAIT_INPUT',
  WILD_ENEMY_MON_FAINTED_AWAIT_INPUT: 'WILD_ENEMY_MON_FAINTED_AWAIT_INPUT',
  PLAYER_MON_FAINTED: 'PLAYER_MON_FAINTED',
  PLAYER_MON_FAINTED_AWAIT_INPUT: 'PLAYER_MON_FAINTED_AWAIT_INPUT',
})

/** @enum {object} */
const BATTLE_PLAYERS = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY'
})

/**
 * @typedef {object} FrameInput
 * @property {boolean} ok
 * @property {boolean} cancel
 * @property {import('../types/direction.js').Direction} direction
 */


export class BattleScene extends Phaser.Scene {
  /** @type {BattleMenu} */
  #battleMenu
  /** @type {Controls} */
  #controls
  /** @type {EnemyBattleMon} */
  #activeEnemyMon
  /** @type {PlayerBattleMon} */
  #activePlayerMon
  /** @type {number} */
  #activePlayerAttackIndex
  /** @type {StateMachine} */
  #battleStateMachine
  /** @type {AttackManager} */
  #attackManager
  /** @type {BattleTrainer} */
  #enemyBattleTrainer
  /** @type {BattlePlayer} */
  #battlePlayer
  /** @type {EnemyBattleMon[]} */
  #opponentMons
  /** @type {OPPONENT_TYPES} */
  #opponentType
  /** @type {import('../types/typedef.js').Trainer} */
  #enemyTrainer
  /** @type {AudioManager} */
  #audioManager
  /** @type {import('../types/typedef.js').PlayerData} */
  #player
  /** @type {PlayerBattleMon[]} */
  #playerMons
  /** @type {string} */
  #victoryBgmKey
  /** @type {import('../types/typedef.js').PostAttackResult} */
  #lastAttackResult
  /** @type {BATTLE_PLAYERS[]} */
  #playersThatHadATurn
  /** @type {import('../types/typedef.js').Item} */
  #activePlayerItem
  /** @type {PartyMon} */
  #activePlayerSwitchMon
  /** @type {import('../types/typedef.js').Mon[]} */
  #evolutionPendingMons
  /** @type {string[]} */
  #postExperienceGainMsgs
  /** @type {LearnAttackManager} */
  #learnAttackManager
  /** @type {import('../types/typedef.js').ItemUsedResult} */
  #itemUsedResult

  /**
   * @type {object}
   * @property {Mon} mon
   * @property {BaseMon} baseMon
  */
  #generatedMon

  constructor () {
    super({
      key: SCENE_KEYS.BATTLE_SCENE
    })
    this.#activePlayerAttackIndex = -1
    this.#activePlayerItem = null
    this.#player = null
    this.#playerMons = []
    this.#playersThatHadATurn = []
    this.#activePlayerSwitchMon = null
    this.#evolutionPendingMons = []
    this.#postExperienceGainMsgs = []
    this.#itemUsedResult = null
  }
  
  /**
   * 
   * @param {import('../types/typedef.js').BattleSceneConfig} battleSceneConfig 
   */
  init (battleSceneConfig) {
    console.log(`[${BattleScene.name}:init] invoked`)
    this.#opponentType = battleSceneConfig.type
    this.#enemyTrainer = battleSceneConfig.trainer
    this.#generatedMon = battleSceneConfig.generatedMon

    this.#getPlayerDataFromStore()
  }
  
  preload () {
    console.log(`[${BattleScene.name}:preload] invoked`)

    this.#victoryBgmKey = BGM_ASSET_KEYS.WILD_ENCOUNTER_VICTORY
    if (!this.#opponentIsWildMon()) {
      this.#victoryBgmKey = BGM_ASSET_KEYS.TRAINER_VICTORY
    }

    this.load.audio(BGM_ASSET_KEYS[this.#victoryBgmKey], [`${BGM_ASSETS_PATH}/${this.#victoryBgmKey}.flac`])
  }

  create () {
    console.log(`[${BattleScene.name}:create] invoked`)
    this.cameras.main.setBackgroundColor('#fff')

    this.#audioManager = this.registry.get('audio')
    this.#battleMenu = new BattleMenu(this)
    this.#attackManager = new AttackManager(this, SKIP_ANIMATIONS)
    this.#controls = new Controls(this)
    this.#learnAttackManager = new LearnAttackManager(this)

    this.#setUpBattleMons()
    this.#createBattleStateMachine()

    this.events.on(EVENT_KEYS.BATTLE_RUN_ATTEMPT, () => {
      this.#battleStateMachine.setState(BATTLE_STATES.RUN_ATTEMPT_AWAIT_INPUT)
    })
  }

  update () {
    this.#battleStateMachine.update()

    if (!this.#battleStateMachine.currentStateName.endsWith('_AWAIT_INPUT')) {
      return
    }
    const input = this.#getFrameInput(this.#controls)
    this.#handleInputForState(input)
  }

  /**
   * 
   * @param {FrameInput} input
   */
  #handleInputForState (input) {
    switch (this.#battleStateMachine.currentStateName) {
      case BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT:
        this.#routePlayersDecisionInput(input)
        break
      case BATTLE_STATES.GAIN_EXP_AWAIT_INPUT:
        if (this.#learnAttackManager.learningNewAttack) {
          this.#routeLearnAttackInput(input)
          return
        }
        this.#routeBattleMenuDialogOk(input)
        break
      default:
        this.#routeBattleMenuDialogOk(input)
        break
    }
  }

  /**
   * @param {FrameInput} input 
   */
  #routePlayersDecisionInput (input) {
    if (input.cancel) {
      this.#battleMenu.handlePlayerInput('CANCEL')
      return
    }

    if (input.direction !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(input.direction)
      return
    }

    if (!input.ok) {
      return
    }

    this.#battleMenu.handlePlayerInput('OK')

    if (!this.#playerJustSelectedAnAttack() && !this.#playerJustSelectedAnItem() && !this.#playerJustSelectedAMonToSwitch()) {
      return
    }
    this.#changeToEnemysTurnToPlay()
  }

  /**
   * 
   * @param {FrameInput} input
   * @returns {boolean}
   */
  #routeLearnAttackInput (input) {
    if (this.#learnAttackManager.learningNewAttack) {
      if (input.ok) {
        this.#learnAttackManager.handlePlayerInput('OK')
        return true
      }

      if (input.cancel) {
        this.#learnAttackManager.handlePlayerInput('CANCEL')
        return true
      }

      if (input.direction !== DIRECTION.NONE) {
        this.#learnAttackManager.handlePlayerInput(input.direction)
      }
      return true
    }
    return false
  }

  /**
   * 
   * @param {FrameInput} input
   * @returns {boolean}
   */
  #routeBattleMenuDialogOk (input) {
    if (input.ok || input.cancel) {
      this.#battleMenu.handlePlayerInput('OK')
      return
    }
  }

  /**
   * 
   * @returns {FrameInput}
   */
  #getFrameInput (controls) {
    return {
      ok: controls.wasSpaceKeyPressed(),
      cancel: controls.wasBackKeyPressed(),
      direction: controls.getDirectionKeyJustPressed()
    }
  }


  #createBattleStateMachine () {
    this.#battleStateMachine = new StateMachine('battle', this)
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.INTRO,
      onEnter: () => {
        this.#createBattleTrainers()
        this.#bringOutPlayerTrainer()

        if (this.#opponentIsWildMon()) {
          this.#battleStateMachine.setState(BATTLE_STATES.WILD_MON_OUT)
          return
        }

        this.#enemyBattleTrainer.playCharacterAppearAnimation(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.INTRO_AWAIT_INPUT)
        })
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.INTRO_AWAIT_INPUT,
      onEnter: () => {
        this.#introduceEnemyTrainer(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_CHOOSE_MON,
      onEnter: () => {
        this.#resetTurnTracker()
        this.#enemyChooseNextMon()

        if (!this.#activeEnemyMon) {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_VICTORY_AWAIT_INPUT)
          return
        }

        let simulateTimeToChoose = 750
        if (this.#battleJustStarted()) {
          simulateTimeToChoose = 100
        }
        
        this.time.delayedCall(simulateTimeToChoose, () => {
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_OUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_MON_OUT,
      onEnter: () => {
        this.#attackManager.enemyMonImageGameObject = this.#activeEnemyMon.phaserMonImageGameObject
        this.#hideEnemyTrainer(() => {
          this.#introduceEnemyMon(() => {
            if (!this.#activePlayerMon) {
              this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
              return
            }
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT)
          })
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_MON_OUT,
      onEnter: () => {
        this.#attackManager.enemyMonImageGameObject = this.#activeEnemyMon.phaserMonImageGameObject
        this.#activeEnemyMon.playMonAppearAnimation(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.WILD_MON_OUT_AWAIT_INPUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_MON_OUT_AWAIT_INPUT,
      onEnter: () => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
        }, SKIP_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_CHOOSE_MON,
      onEnter: () => {
        this.#resetTurnTracker()
        this.#playerChooseNextMon()

        if (!this.#activePlayerMon) {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DEFEATED)
          return
        }
        
        let simulateTimeToChoose = 750
        if (this.#battleJustStarted()) {
          simulateTimeToChoose = 100
        }
        
        this.time.delayedCall(simulateTimeToChoose, () => {
          this.#setPlayerMonToBattleMenu()
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_OUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_MON_OUT,
      onEnter: () => {
        this.#attackManager.playerMonImageGameObject = this.#activePlayerMon.phaserMonImageGameObject
        this.#hidePlayerTrainer(() => {
          this.#introducePlayerMon(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT)
          })
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_SWITCH,
      onEnter: () => {
        this.#introducePlayerMon(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT,
      onEnter: () => {
        this.#battleMenu.showMainBattleMenu()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_DECISION,
      onEnter: () => {
        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BATTLE,
      onEnter: () => {
        this.#lastAttackResult = null

        this.#battleMenu.hideItemMenu()
        this.#battleMenu.hidePartyMenu()

        if (this.#enemyHadATurn() && this.#playerHadATurn()) {
          this.#resetTurnTracker()

          this.#checkPostBattleTurnMonStatusEffect(this.#activePlayerMon, () => {

            if (this.#activePlayerMon.isFainted) {
              this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_FAINTED)
              return
            }

            this.#checkPostBattleTurnMonStatusEffect(this.#activeEnemyMon, () => {

              if (this.#activeEnemyMon.isFainted) {
                this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_FAINTED)
                return
              }

              this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT)
            })
          })
          return
        }

        if (!this.#enemyHadATurn() && !this.#playerHadATurn()) {
          this.#determineAndTakeFirstTurn()
          return
        }

        if (this.#enemyHadATurn()) {
          this.#playersThatHadATurn.push(BATTLE_PLAYERS.PLAYER)
          this.#playPlayersTurnSequence()
          return
        }

        if (this.#playerHadATurn()) {
          this.#playersThatHadATurn.push(BATTLE_PLAYERS.ENEMY)
          this.#playEnemysTurnSequence()
          return
        }
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ATTACK_AWAIT_INPUT,
      onEnter: () => {
        this.#announceAttackEffects(() => {
          if (this.#activeEnemyMon.isFainted) {
            this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_FAINTED)
            return
          }

          if (this.#activePlayerMon.isFainted) {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_FAINTED)
            return
          }
          
          this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_MON_FAINTED,
      onEnter: () => {
        this.#activeEnemyMon.playDeathAnimation(() => {
          if (this.#opponentIsWildMon()) {
            this.#audioManager.playBgm(this.#victoryBgmKey)
            this.#battleStateMachine.setState(BATTLE_STATES.WILD_ENEMY_MON_FAINTED_AWAIT_INPUT)
            return
          }
          this.#enemyBattleTrainer.redrawRemainingMonsGameObject()
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_FAINTED_AWAIT_INPUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_ENEMY_MON_FAINTED_AWAIT_INPUT,
      onEnter: () => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} fainted!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXP)
        }, SKIP_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_MON_FAINTED_AWAIT_INPUT,
      onEnter: () => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Foe's ${this.#activeEnemyMon.name} fainted!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXP)
        }, SKIP_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_MON_FAINTED,
      onEnter: () => {
        this.#battlePlayer.redrawRemainingMonsGameObject(true)
        this.#activePlayerMon.playDeathAnimation(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_FAINTED_AWAIT_INPUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_MON_FAINTED_AWAIT_INPUT,
      onEnter: () => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
        }, SKIP_ANIMATIONS)
      }
    })


    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ITEM_USED_AWAIT_INPUT,
      onEnter: () => {
        const { msg, wasSuccessful } = this.#itemUsedResult
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([msg], () => {
          // check if enemy mon was captureD
          if (this.#activePlayerItem.typeKey === ITEM_TYPE_KEY.BALL && wasSuccessful) {
            this.#addWildMonToParty()
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
            return
          }
          this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
        }, SKIP_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.GAIN_EXP,
      onEnter: () => {
        this.#getAndSetExpGainedMsgs(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.GAIN_EXP_AWAIT_INPUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.GAIN_EXP_AWAIT_INPUT,
      onEnter: () => {
        this.#postExperienceGainedSequence()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_VICTORY_AWAIT_INPUT,
      onEnter: () => {
        this.#audioManager.playBgm(this.#victoryBgmKey)
        this.#announcePlayerVictory(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_DEFEATED,
      onEnter: () => {
        this.#updatePlayerPartyMons()
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DEFEATED_AWAIT_INPUT)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_DEFEATED_AWAIT_INPUT,
      onEnter: () => {
        this.#annoucePlayerDefeat(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.RUN_ATTEMPT_AWAIT_INPUT,
      onEnter: () => {
        if (this.#runAttemptSucceeded()) {
          this.#audioManager.playSfx(SFX_ASSET_KEYS.RUN, { primaryAudio: true })
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(['Got away safely...'], () => {
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
          }, SKIP_ANIMATIONS)
        } else {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Couldn't get away!`], () => {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DECISION_AWAIT_INPUT)
          }, SKIP_ANIMATIONS)
        }
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FINISHED,
      onEnter: () => {
        this.#resetTurnTracker()
        this.#resetBattleMons()
        this.#transitionToNextScene()
      }
    })

    this.#battleStateMachine.setState(BATTLE_STATES.INTRO)
  }

  /**
   * 
   * @param {BattleMon} mon 
   * @param {import('../types/typedef.js').Attack} attk
   * @param {() => void} callback
   */
  #announceAttack (mon, attk, callback) {
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${mon.name} used ${attk.name}!`, { callback })
  }

  /**
   * 
   * @param {BattleMon} mon 
   * @param {import('../types/status-effect.js').StatusEffect} status 
   * @param {() => void} callback 
   */
  #announceStatusEffectApplied (mon, status, callback) {
    let msg = `${mon.name} `

    switch (status) {
      case STATUS_EFFECT.FREEZE:
        msg += 'was FROZEN!'
        break
      case STATUS_EFFECT.BURN:
        msg += 'was BURNT!'
        break
      case STATUS_EFFECT.CONFUSE:
        msg += 'became CONFUSED!'
        break
      case STATUS_EFFECT.PARALYSE:
        msg += 'was PARALYZED!'
        break
      default:
        exhaustiveGuard(status)
        break
    }
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(msg, {
      callback,
      delayCallbackMs: 1000
    })
  }

  /**
   * 
   * @param {BattleMon} mon
   * @param {() => void} callback
   */
  #checkPostBattleTurnMonStatusEffect (mon, callback) {
    /** @type {import('../types/status-effect.js').StatusEffect[]} */
    const postBattleStatusEffects = [
      STATUS_EFFECT.BURN
    ]
    
    if (!postBattleStatusEffects.includes(mon.currentStatusEffect)) {
      callback()
      return
    }

    const { statusEffect } = mon.rollStatusEffectRemoval()
    let msg = ''

    const showMessage = () => {
      this.#battleMenu.updateInfoPanelMessagesNoInputRequired(msg, {
        callback,
        delayCallbackMs: 800
      })
    }

    switch (statusEffect) {
      case STATUS_EFFECT.BURN:
        mon.playBurntAnim(() => {
          msg = `${mon.name} was hurt by their burn.`
          mon.playMonTakeDamageSequence(mon.maxHealth * 0.10,  {
            skipAnimation: true,
            callback: () => showMessage()
          })
        })
        break
      }
  }

  /**
   * 
   * @param {BattleMon} mon
   * @param {(canAttack: boolean) => void} callback
   */
  #checkPreAttackMonStatusEffect (mon, callback) {
    /** @type {import('../types/status-effect.js').StatusEffect[]} */
    const preAttackStatusEffects = [
      STATUS_EFFECT.FREEZE,
      STATUS_EFFECT.CONFUSE,
      STATUS_EFFECT.PARALYSE
    ]
    
    if (!preAttackStatusEffects.includes(mon.currentStatusEffect)) {
      callback(true)
      return
    }

    const { result, statusEffect } = mon.rollStatusEffectRemoval()
    let canAttack = result
    let msg = ''

    const showMessage = () => {
      this.#battleMenu.updateInfoPanelMessagesNoInputRequired(msg, {
        callback: () => callback(canAttack),
        delayCallbackMs: 800
      })
    }

    switch (statusEffect) {
      case STATUS_EFFECT.FREEZE:
        msg = result
          ? `${mon.name} thawed out!`
          : `${mon.name} is frozen solid...`
        showMessage()
        break
      case STATUS_EFFECT.CONFUSE:
        if (result) {
          msg = `${mon.name} snapped out of their confusion!`
          showMessage()
          return
        }

        const hitSelf = Phaser.Math.Between(0, 1) === 1
        
        if (hitSelf) {
          mon.playConfusedAnim(() => {
            msg = `${mon.name} hurt itself in confusion...`
            canAttack = false
            mon.playMonTakeDamageSequence(mon.maxHealth * 0.10,  {
              sfxAssetKey: SFX_ASSET_KEYS.TAKE_DAMAGE,
              callback: () => showMessage()
            })
          })
          return
        }
        callback(true)
        break
      case STATUS_EFFECT.PARALYSE:
        canAttack = Phaser.Math.Between(0, 1) === 1
        if (!canAttack) {
          mon.playParalyzedAnim(() => {
            msg = `${mon.name} couldn't move!`
            showMessage()
          })
          return
        }
        callback(true)
        break
    }
  }

  /**
   * 
   * @returns {import('../types/typedef.js').Attack}
   */
  #getPlayerAttack () {
    return this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
  }

  /**
   * @param {() => void} callback
   */
  #playEnemyApplyStatusEffect (callback) {
    this.#activeEnemyMon.applyStatusEffect(this.#lastAttackResult.statusEffect, () => {
      this.#announceStatusEffectApplied(this.#activeEnemyMon, this.#lastAttackResult.statusEffect, () => callback())
    })
  }

  /**
   * @param {() => void} callback
   */
  #playPlayerApplyStatusEffect (callback) {
    this.#activePlayerMon.applyStatusEffect(this.#lastAttackResult.statusEffect, () => {
      this.#announceStatusEffectApplied(this.#activePlayerMon, this.#lastAttackResult.statusEffect, () => callback())
    })
  }

  #playerAttack () {
    this.#checkPreAttackMonStatusEffect(this.#activePlayerMon, (canAttack) => {

      if (!canAttack) {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
        return
      }

      const attack = this.#getPlayerAttack()
      this.#announceAttack(this.#activePlayerMon, attack, () => {
        this.#attackManager.playAttackSequence(
          this.#activePlayerMon,
          this.#activeEnemyMon,
          attack,
          ATTACK_TARGET.ENEMY,
          (result) => {
            this.#lastAttackResult = result
            this.#activeEnemyMon.playMonTakeDamageSequence(this.#lastAttackResult.damage.damageTaken,  {
              sfxAssetKey: this.#determinePostAttackSoundEffect(),
              callback: () => {
                if (this.#lastAttackResult.statusEffect) {
                  this.#playEnemyApplyStatusEffect(() => {
                    this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
                  })
                  return
                }
                this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
              }
            })
          }
        )
      })
    })
  }

  /**
   * 
   * @returns {import('../types/typedef.js').Attack}
   */
  #getEnemyAttack () {
    return this.#activeEnemyMon.attacks[Phaser.Math.Between(0, this.#activeEnemyMon.attacks.length - 1)]
  }


  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      return
    }

    this.#checkPreAttackMonStatusEffect(this.#activeEnemyMon, (canAttack) => {

      if (!canAttack) {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
        return
      }

      const attack = this.#getEnemyAttack()
      this.#announceAttack(this.#activeEnemyMon, attack, () => {
        this.#attackManager.playAttackSequence(
          this.#activeEnemyMon,
          this.#activePlayerMon,
          attack,
          ATTACK_TARGET.PLAYER,
          (result) => {
            this.#lastAttackResult = result
            this.#activePlayerMon.playMonTakeDamageSequence(this.#lastAttackResult.damage.damageTaken,  {
              sfxAssetKey: this.#determinePostAttackSoundEffect(),
              callback: () => {
                if (this.#lastAttackResult.statusEffect) {
                  this.#playPlayerApplyStatusEffect(() => {
                    this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
                  })
                  return
                }
                this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK_AWAIT_INPUT)
              }
            })
          }
        )
      })
    })
  }

  /**
   * 
   * @returns {string|null}
   */
  #determinePostAttackSoundEffect () {
    if (!this.#lastAttackResult.damage.damageTaken) {
      return null
    }
    if (this.#lastAttackResult.damage.wasSuperEffective) {
      return SFX_ASSET_KEYS.SUPER_EFFECTIVE
    }

    if (this.#lastAttackResult.damage.wasResistant) {
      return SFX_ASSET_KEYS.NOT_VERY_EFFECTIVE
    }

    return SFX_ASSET_KEYS.TAKE_DAMAGE
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #announceAttackEffects (callback) {
    if (!this.#lastAttackResult) {
      callback()
      return
    }

    let postAttackMsgs = []
    const {
      wasCriticalHit,
      wasSuperEffective,
      wasImmune,
      wasResistant,
      damageTaken
    } = this.#lastAttackResult.damage

    if (damageTaken) {
      if (wasCriticalHit) {
        postAttackMsgs.push('A critical hit!')
      }

      if (wasSuperEffective) {
        postAttackMsgs.push(`It's super effective!`)
      }

      if (wasResistant) {
        postAttackMsgs.push(`It's not very effective...`)
      }
    }

    if (wasImmune) {
      postAttackMsgs.push(`But nothing happened!`)
    } else if (!damageTaken && !this.#lastAttackResult.statusEffect) {
      postAttackMsgs.push(`But it did nothing!`)
    }

    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(postAttackMsgs, callback, SKIP_ANIMATIONS)
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #getAndSetExpGainedMsgs (callback) {
    this.#postExperienceGainMsgs = []

    const expGained = calculateExperienceGained(this.#activeEnemyMon.currentLevel)
    const msgs = [`${this.#activePlayerMon.name} gained ${expGained} experience points!`]
    this.#activePlayerMon.gainExperience(expGained, (didLevelUp, evolved) => {
      if (didLevelUp) {
        this.#audioManager.playSfx(SFX_ASSET_KEYS.LEVEL_UP, { primaryAudio: true })
        msgs.unshift(`${this.#activePlayerMon.name} grew to level ${this.#activePlayerMon.currentLevel}!`)
        if (evolved) {
          this.#evolutionPendingMons.push(this.#activePlayerMon.monDetails)
        }
      }
      this.#postExperienceGainMsgs = msgs
      callback()
    })
  }

  #transitionToNextScene () {
    if (this.#evolutionPendingMons.length) {
      this.#startEvolveScene()
      return
    }
    this.cameras.main.fadeOut(500, 255, 255, 255)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.WORLD_SCENE)
    })
  }

  #playPlayersTurnSequence () {
    if (this.#activePlayerMon.isFainted) {
      return
    }

    if (this.#playerAttackWasSelected()) {
      this.#playerAttack()
      return
    }
    if (this.#playerItemWasSelected()) {
      this.#playerUseItem()
      return
    }
    if (this.#playerMonToSwitchWasSelected()) {
      this.#playerSwitchMon()
      return
    }
  }

  #playerUseItem () {
    this.#itemUsedResult = null
    this.#battleMenu.hideItemMenu()
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#battlePlayer.name} used ${this.#activePlayerItem.name}.`, {
      delayCallbackMs: 500,
      callback: () => {
        playItemEffect(this, {
          mon: this.#activePlayerMon,
          enemyMon: this.#activeEnemyMon,
          item: this.#activePlayerItem,
          callback: (res) => {
            this.#itemUsedResult = res
            this.#battleStateMachine.setState(BATTLE_STATES.ITEM_USED_AWAIT_INPUT)
          }
        })
      }
    })
  }

  #playerSwitchMon () {
    this.#battleMenu.hidePartyMenu()
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Come back, ${this.#activePlayerMon.name}.`, {
      callback: () => {
        this.#activePlayerMon.playMonSwitchedOutAnimation(() => {
          this.#activePlayerMon = this.#playerMons.find(battleMon => battleMon.id === this.#activePlayerSwitchMon.id)
          this.#activePlayerSwitchMon = null
          this.#setPlayerMonToBattleMenu()
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_SWITCH)
        })
      }
    })
  }

  #playEnemysTurnSequence () {
    if (this.#activeEnemyMon.isFainted) {
      return
    }
    // query battle trainer for smart decision, etc TODO
    this.#enemyAttack()
  }
      
  #setUpBattleMons () {
    this.#playerMons = this.#player.partyMons.map((pm, i) => {
      return new PlayerBattleMon({
        scene: this,
        monDetails: pm,
        skipBattleAnimations: SKIP_ANIMATIONS
      })
    })

    if (!this.#opponentIsWildMon()) {
      this.#opponentMons = this.#enemyTrainer.partyMons.map((pm, i) => {
        return new EnemyBattleMon({
          scene: this,
          monDetails: pm,
          skipBattleAnimations: SKIP_ANIMATIONS
        })
      })
      return
    }

    this.#opponentMons = [
      new EnemyBattleMon({
        scene: this,
        monDetails: this.#generatedMon.mon,
        skipBattleAnimations: SKIP_ANIMATIONS
      })
    ]
    this.#activeEnemyMon = this.#opponentMons[0]
  }

  #getPlayerDataFromStore () {
    this.#player = {
      name: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_NAME),
      partyMons: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS),
      inventory: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY),
    }
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerJustSelectedAnAttack () {
    this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack
    return this.#playerAttackWasSelected()
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerAttackWasSelected () {
    return !!this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerJustSelectedAMonToSwitch () {
    this.#activePlayerSwitchMon = this.#battleMenu.selectedMonToSwitchTo
    return this.#playerMonToSwitchWasSelected()
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerMonToSwitchWasSelected () {
    return !!this.#activePlayerSwitchMon
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerJustSelectedAnItem () {
    this.#activePlayerItem = this.#battleMenu.selectedItem
    return this.#playerItemWasSelected()
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerItemWasSelected () {
    return !!this.#activePlayerItem
  }

  #changeToEnemysTurnToPlay () {
    this.#battleMenu.hideMonAttackSubMenu()
    this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_DECISION)
  }

  /**
   * 
   * @returns {boolean}
   */
  #opponentIsWildMon () {
    return this.#opponentType === OPPONENT_TYPES.WILD_ENCOUNTER
  }

  #createBattleTrainers () {
    if (!this.#opponentIsWildMon()) {
      this.#enemyBattleTrainer = new BattleTrainer(this, this.#enemyTrainer, this.#opponentMons, {
        skipBattleAnimations: SKIP_ANIMATIONS,
        assetKey: this.#enemyTrainer.assetKey
      })
    }
    this.#battlePlayer = new BattlePlayer(this, this.#player, this.#playerMons, {
      assetKey: TRAINER_SPRITES.RED,
      skipBattleAnimations: SKIP_ANIMATIONS
    })
  }

  #bringOutPlayerTrainer () {
    this.#battlePlayer.playCharacterAppearAnimation()
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #introduceEnemyTrainer (callback) {
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} wants to fight!`], () => {
      this.#enemyBattleTrainer.playCharacterDisappearAnimation(() => callback())
    }, SKIP_ANIMATIONS)
  }

  #enemyChooseNextMon () {
    if (this.#activeEnemyMon) {
      this.#activeEnemyMon.hideBattleDetails()
    }

    this.#activeEnemyMon = null
    this.#enemyBattleTrainer.showRemainingMons()
    this.#activeEnemyMon = this.#opponentMons.find(mon => !mon.isFainted)
  }

  #resetTurnTracker () {
    this.#playersThatHadATurn = []
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #hideEnemyTrainer (callback) {
    this.#enemyBattleTrainer.hideRemainingMons()
    this.#enemyBattleTrainer.playCharacterDisappearAnimation(callback)
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #introduceEnemyMon (callback) {
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#enemyBattleTrainer.name.toUpperCase()} sent out ${this.#activeEnemyMon.name}!`, {
      delayCallbackMs: 500,
      callback: () => {
        this.#activeEnemyMon.playMonAppearAnimation(callback, true)
      }
    })          
  }


  #playerChooseNextMon () {
    if (this.#activePlayerMon) {
      this.#activePlayerMon.hideBattleDetails()
    }

    this.#activePlayerMon = null
    this.#battlePlayer.showRemainingMons()
    this.#activePlayerMon = this.#playerMons.find(mon => !mon.isFainted)
  }

  #setPlayerMonToBattleMenu () {
    this.#battleMenu.activePlayerMon = this.#activePlayerMon
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #hidePlayerTrainer (callback) {
    this.#battlePlayer.hideRemainingMons()
    this.#battlePlayer.playCharacterDisappearAnimation(callback)
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #introducePlayerMon (callback) {
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Go! ${this.#activePlayerMon.name}!`, {
      delayCallbackMs: 500,
      callback: () => {
        this.#activePlayerMon.playMonAppearAnimation(callback)
      }
    })
  }

  #battleJustStarted () {
    return this.#battlePlayer.characterSpriteShowing
  }

  /**
   * 
   * @returns {boolean}
   */
  #enemyWonFirstTurn () {
    return this.#activeEnemyMon.monStats.speed > this.#activePlayerMon.monStats.speed
  }

  #determineAndTakeFirstTurn () {
    if (this.#enemyWonFirstTurn()) {
      this.#playersThatHadATurn.push(BATTLE_PLAYERS.ENEMY)
      this.#playEnemysTurnSequence()
      return
    }
    this.#playersThatHadATurn.push(BATTLE_PLAYERS.PLAYER)
    this.#playPlayersTurnSequence()
    return
  }

  #enemyHadATurn () {
    return this.#playersThatHadATurn.includes(BATTLE_PLAYERS.ENEMY)
  }

  #playerHadATurn () {
    return this.#playersThatHadATurn.includes(BATTLE_PLAYERS.PLAYER)
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #announcePlayerVictory (callback) {
    if (this.#opponentIsWildMon()) {
      callback()
      return
    }

    const msgs = [
      `${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} was defeated!`,
      `"${this.#enemyTrainer.defeatedMsg}"`,
      `You were paid $${this.#enemyTrainer.rewardOnVictory} as winnings!`
    ]

    this.#enemyBattleTrainer.showTrainer()
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, callback, SKIP_ANIMATIONS)
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #annoucePlayerDefeat (callback) {
    this.#battlePlayer.showTrainer()
    const msgs = [`YOU have no more usable Pokemon!`]
    if (!this.#opponentIsWildMon()) {
      msgs.push(`You paid out $${this.#enemyTrainer.payOutOnDefeat}...`)
    }
    msgs.push(`YOU whited out!`)
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, callback, SKIP_ANIMATIONS)
  }

  #resetBattleMons () {
    this.#activeEnemyMon = null
    this.#activePlayerMon = null
  }

  /**
   * 
   * @returns {boolean}
   */
  #runAttemptSucceeded () {
    return true
  }

  #addWildMonToParty () {
    const partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)
    if (partyMons.length > 5) {
      return
    }

    partyMons.push({
      ...this.#activeEnemyMon.monDetails,
      id: Date.now() + Math.floor(Math.random() * 1000)
    })

    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, partyMons)
    dataManager.saveData()
  }

  #startEvolveScene () {
    this.load.once('complete', () => {
      const dialog = new DialogUi(this)
      dialog.showDialogModalNoInputRequired(['Wait.. Wuh?'])
      this.time.delayedCall(1000, () => {
        this.cameras.main.fadeOut(500, 255, 255, 255)
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start(SCENE_KEYS.EVOLVE_SCENE, {
            toEvolve: this.#evolutionPendingMons
          })
        })
      })
    })
  
    this.#evolutionPendingMons.forEach(mon => {
      const evolveFrom = DataUtils.getBaseMonDetails(this, mon.baseMonIndex)
      const evolveTo = DataUtils.getBaseMonDetails(this, evolveFrom.evolvesTo)
      loadBaseMonAssets(this, evolveTo)
    })
    
    this.load.start()
  }

  #postExperienceGainedSequence () {
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(this.#postExperienceGainMsgs, () => {
      this.#postExperienceGainMsgs = []
      this.#learnAttackManager.checkMonHasNewMoveToLearn(this.#activePlayerMon.monDetails, (newAttackIds) => {
        if (newAttackIds) {
          this.#activePlayerMon.updateAttackIds(newAttackIds)
          this.#battleMenu.createMonAttackSubMenu()

          if (this.#opponentIsWildMon()) {
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
            return
          }
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
          return
        }

        if (this.#opponentIsWildMon()) {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
          return
        }
        this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
      })
    })
  }

  #updatePlayerPartyMons () {
    const updated = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS).map(mon => {
      const hp = getMonStats(DataUtils.getBaseMonDetails(this, mon.baseMonIndex), mon).hp
      mon.currentHp = hp
      return mon
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, updated)
  }
}