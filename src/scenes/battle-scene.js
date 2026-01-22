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
import { BGM_ASSET_KEYS, TRAINER_SPRITES } from '../assets/asset-keys.js'
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
import { loadMonAssets } from '../utils/load-assets.js'
import { LearnAttackManager } from '../common/learn-attack-mananger.js'
import { STATUS_EFFECT } from '../types/status-effect.js'
import { exhaustiveGuard } from '../utils/guard.js'


/** @enum {object} */
const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',
  WILD_MON_OUT: 'WILD_MON_OUT',
  ENEMY_MON_OUT: 'ENEMY_MON_OUT',
  PLAYER_MON_OUT: 'PLAYER_MON_OUT',
  PLAYERS_PLAY: 'PLAYERS_PLAY',
  ENEMYS_PLAY: 'ENEMYS_PLAY',
  BATTLE: 'BATTLE',
  POST_ATTACK: 'POST_ATTACK',
  FINISHED: 'FINISHED',
  RUN_ATTEMPT: 'RUN_ATTEMPT',
  ENEMY_CHOOSE_MON: 'ENEMY_CHOOSE_MON',
  PLAYER_CHOOSE_MON: 'PLAYER_CHOOSE_MON',
  PLAYER_VICTORY: 'PLAYER_VICTORY',
  PLAYER_DEFEATED: 'PLAYER_DEFEATED',
  ITEM_USED: 'ITEM_USED',
  POST_ITEM_USED: 'POST_ITEM_USED',
  PLAYER_SWITCH: 'PLAYER_SWITCH',
  GAINING_EXPERIENCE: 'GAINING_EXPERIENCE',
  POST_EXPERIENCE_GAINED: 'POST_EXPERIENCE_GAINED',
  STATUS_EFFECT_CHECK: 'STATUS_EFFECT_CHECK',
  MON_FAINTED: 'MON_FAINTED'
})

/** @enum {object} */
const BATTLE_PLAYERS = Object.freeze({
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY'
})


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
  #postExperienceGainMsgs
  /** @type {LearnAttackManager} */
  #learnAttackManager

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
  
    this.load.audio(BGM_ASSET_KEYS[this.#victoryBgmKey], [`assets/audio/bgm/${this.#victoryBgmKey}.flac`])
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
      this.#battleStateMachine.setState(BATTLE_STATES.RUN_ATTEMPT)
    })
  }

  update () {
    this.#battleStateMachine.update()
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
    const wasBackKeyPressed = this.#controls.wasBackKeyPressed()
    const selectedDirection = this.#controls.getDirectionKeyJustPressed()
  
    if (this.#learnAttackManager.learningNewAttack) {
      if (wasSpaceKeyPresed) {
        this.#learnAttackManager.handlePlayerInput('OK')
        return
      }

      if (wasBackKeyPressed) {
        this.#learnAttackManager.handlePlayerInput('CANCEL')
        return
      }

      if (selectedDirection !== DIRECTION.NONE) {
        this.#learnAttackManager.handlePlayerInput(selectedDirection)
      }
      return
    }
    
    if (wasSpaceKeyPresed && this.#needsOkInputToContinue()) {
      this.#battleMenu.handlePlayerInput('OK')
      return
    }

    if (!this.#waitingForPlayerToTakeTurn()) {
      return
    }

    if (wasBackKeyPressed) {
      this.#battleMenu.handlePlayerInput('CANCEL')
      return
    }

    
    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection)
    }

    if (wasSpaceKeyPresed) {
      this.#battleMenu.handlePlayerInput('OK')

      if (!this.#playerJustSelectedAnAttack() && !this.#playerJustSelectedAnItem() && !this.#playerJustSelectedAMonToSwitch()) {
        return
      }

      this.#changeToEnemysTurnToPlay()
      return
    }
  }

  /**
   * 
   * @param {BattleMon} mon 
   * @param {import('../types/typedef.js').Attack} attk
   * @param {() => void} callback
   */
  #announceAttack (mon, attk, callback) {
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${mon.name} used ${attk.name}!`, callback, SKIP_ANIMATIONS)
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
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([msg], callback, SKIP_ANIMATIONS)
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
      this.#battleMenu.updateInfoPanelMessagesNoInputRequired(msg, () => {
        this.time.delayedCall(500, () => {
          callback()
        })
      }, SKIP_ANIMATIONS)
    }

    switch (statusEffect) {
      case STATUS_EFFECT.BURN:
        msg = `${mon.name} was hurt by their burn.`
        mon.takeDamage(mon.maxHealth * 0.10, () => {
          showMessage()
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
      this.#battleMenu.updateInfoPanelMessagesNoInputRequired(msg, () => {
        this.time.delayedCall(500, () => {
          callback(canAttack)
        })
      }, SKIP_ANIMATIONS)
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
          msg = `${mon.name} hurt itself in confusion...`
          canAttack = false
          mon.takeDamage(10, () => {
            showMessage()
          })
          return
        }
        callback(true)
        break
      case STATUS_EFFECT.PARALYSE:
        canAttack = Phaser.Math.Between(0, 1) === 1
        if (!canAttack) {
          msg = `${mon.name} couldn't move!`
          showMessage()
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

  #playEnemyDamageTakenAnimation () {
    this.#activeEnemyMon.playMonTakeDamageAnimation(() => {
      this.#activeEnemyMon.takeDamage(this.#lastAttackResult.damage.damageTaken, () => {

        if (this.#lastAttackResult.statusEffect) {
          this.#playEnemyApplyStatusEffect(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
          })
          return
        }

        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
      })
    }, this.#lastAttackResult.damage.damageTaken === 0 || SKIP_ANIMATIONS)
  }

  /**
   * @param {() => void} callback
   */
  #playEnemyApplyStatusEffect (callback) {
    this.#battleStateMachine.setState(BATTLE_STATES.STATUS_EFFECT_CHECK)
    this.#activeEnemyMon.applyStatusEffect(this.#lastAttackResult.statusEffect, () => {
      this.#announceStatusEffectApplied(this.#activeEnemyMon, this.#lastAttackResult.statusEffect, () => {
        callback()
      })
    })
  }

  /**
   * @param {() => void} callback
   */
  #playPlayerApplyStatusEffect (callback) {
    this.#battleStateMachine.setState(BATTLE_STATES.STATUS_EFFECT_CHECK)
    this.#activePlayerMon.applyStatusEffect(this.#lastAttackResult.statusEffect, () => {
      this.#announceStatusEffectApplied(this.#activePlayerMon, this.#lastAttackResult.statusEffect, () => {
        callback()
      })
    })
  }

  #playerAttack () {
    this.#checkPreAttackMonStatusEffect(this.#activePlayerMon, (canAttack) => {

      if (!canAttack) {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
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
            this.#playEnemyDamageTakenAnimation()
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

  #playPlayerDamageTakenAnimation () {
    this.#activePlayerMon.playMonTakeDamageAnimation(() => {
      this.#activePlayerMon.takeDamage(this.#lastAttackResult.damage.damageTaken, () => {
  
        if (this.#lastAttackResult.statusEffect) {
          this.#playPlayerApplyStatusEffect(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
          })
          return
        }
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
      })
    }, this.#lastAttackResult.damage.damageTaken === 0)
  }

  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      return
    }

    this.#checkPreAttackMonStatusEffect(this.#activeEnemyMon, (canAttack) => {

      if (!canAttack) {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
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
            this.#playPlayerDamageTakenAnimation()
          }
        )
      })
    })
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

  #playEnemyFaintedSequence () {
    this.#activeEnemyMon.playDeathAnimation(() => {

      if (this.#opponentIsWildMon()) {
        this.#audioManager.playBgm(this.#victoryBgmKey)
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} fainted!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.GAINING_EXPERIENCE)
        }, SKIP_ANIMATIONS)
        return
      }

      this.#enemyBattleTrainer.redrawRemainingMonsGameObject()
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Foe's ${this.#activeEnemyMon.name} fainted!`], () => {
        this.#battleStateMachine.setState(BATTLE_STATES.GAINING_EXPERIENCE)
      }, SKIP_ANIMATIONS)
    })
  }

  #setExperienceGainedGetMessages () {
    const expGained = calculateExperienceGained(this.#activeEnemyMon.currentLevel)
    const msgs = [`${this.#activePlayerMon.name} gained ${expGained} experience points!`]
    this.#activePlayerMon.gainExperience(expGained, (didLevelUp, evolved) => {
      if (didLevelUp) {
        msgs.push(`${this.#activePlayerMon.name} grew to level ${this.#activePlayerMon.currentLevel}!`)
        if (evolved) {
          this.#evolutionPendingMons.push(this.#activePlayerMon.monDetails)
        }
      }
      this.#postExperienceGainMsgs = msgs
      this.#battleStateMachine.setState(BATTLE_STATES.POST_EXPERIENCE_GAINED)
    })
  }

  #playPlayerFaintedSequence () {
    this.#battlePlayer.redrawRemainingMonsGameObject(true)
    this.#activePlayerMon.playDeathAnimation(() => {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`], () => {
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
      }, SKIP_ANIMATIONS)
    })
  }
  
  /**
   * @param {() => void} callback
   * @returns {boolean}
   */
  #checkMonFaintedStatuses (callback) {
    if (this.#activeEnemyMon.isFainted) {
      this.#battleStateMachine.setState(BATTLE_STATES.MON_FAINTED)
      this.#playEnemyFaintedSequence()
      return
    }

    if (this.#activePlayerMon.isFainted) {
      this.#battleStateMachine.setState(BATTLE_STATES.MON_FAINTED)
      this.#playPlayerFaintedSequence()
      return
    }
    callback()
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
          this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
        })

        
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        this.#introduceEnemyTrainer()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_CHOOSE_MON,
      onEnter: () => {
        this.#resetTurnTracker()
        this.#enemyChooseNextMon()

        if (!this.#activeEnemyMon) {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_VICTORY)
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
        this.#hideEnemyTrainer(() => {
          this.#introduceEnemyMon(() => {
            if (!this.#activePlayerMon) {
              this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
              return
            }
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYERS_PLAY)
          })
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_MON_OUT,
      onEnter: () => {
        this.#announceWildMon()
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
        this.#hidePlayerTrainer(() => {
          this.#introducePlayerMon(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYERS_PLAY)
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
      name: BATTLE_STATES.PLAYERS_PLAY,
      onEnter: () => {
        this.#battleMenu.showMainBattleMenu()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMYS_PLAY,
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

        if (this.#allPlayersHadATurn()) {
          this.#resetTurnTracker()
          this.#checkPostBattleTurnMonStatusEffect(this.#activePlayerMon, () => {
            this.#checkMonFaintedStatuses(() => {
              this.#checkPostBattleTurnMonStatusEffect(this.#activeEnemyMon, () => {
                this.#checkMonFaintedStatuses(() => {
                  this.#battleStateMachine.setState(BATTLE_STATES.PLAYERS_PLAY)
                })
              })
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
          this.#enemyAttack()
          return
        }
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ATTACK,
      onEnter: () => {
        this.#announceAttackEffects(() => {
          this.#checkMonFaintedStatuses(() => {
            this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
          })
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.STATUS_EFFECT_CHECK
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.MON_FAINTED
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ITEM_USED
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ITEM_USED,
      onEnter: () => {
        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.GAINING_EXPERIENCE,
      onEnter: () => {
        this.#setExperienceGainedGetMessages()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_EXPERIENCE_GAINED,
      onEnter: () => {
        this.#postExperienceGainedSequence()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_VICTORY,
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
        this.#annoucePlayerDefeat(() => {
          const updated = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS).map(mon => {
            const hp = getMonStats(DataUtils.getBaseMonDetails(this, mon.baseMonIndex), mon).hp
            mon.currentHp = hp
            return mon
          })
          dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, updated)
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        })
        return
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.RUN_ATTEMPT,
      onEnter: () => {
        if (this.#runAttemptSucceeded()) {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(['Got away safely...'], () => {
            this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
          }, SKIP_ANIMATIONS)
        } else {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Couldn't get away!`], () => {
            this.#battleMenu.showMainBattleMenu()
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

  #playerSwitchMon () {
    this.#battleMenu.hidePartyMenu()
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Come back, ${this.#activePlayerMon.name}.`, () => {
      this.#activePlayerMon.playMonSwitchedOutAnimation(() => {
      
        this.#activePlayerMon = this.#playerMons.find(battleMon => battleMon.id === this.#activePlayerSwitchMon.id)
        this.#activePlayerSwitchMon = null
        this.#setPlayerMonToBattleMenu()
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_SWITCH)
      })
    })
  }

  #playerUseItem () {
    this.#battleMenu.hideItemMenu()
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#battlePlayer.name} used ${this.#activePlayerItem.name}.`, () => {
      playItemEffect(this, {
        mon: this.#activePlayerMon,
        enemyMon: this.#activeEnemyMon,
        item: this.#activePlayerItem,
        callback: (res) => {
          const { msg, wasSuccessful } = res
          this.#battleStateMachine.setState(BATTLE_STATES.ITEM_USED)

          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([msg], () => {
            // check if enemy mon was captures
            if (this.#activePlayerItem.typeKey === ITEM_TYPE_KEY.BALL && wasSuccessful) {
              this.#addWildMonToParty()
              this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
              return
            }
            this.#battleStateMachine.setState(BATTLE_STATES.POST_ITEM_USED)
          }, SKIP_ANIMATIONS)
        }
      })
    }, SKIP_ANIMATIONS)
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

  #needsOkInputToContinue () {
    const state = this.#battleStateMachine.currentStateName
    return state === BATTLE_STATES.PRE_BATTLE_INFO ||
      state === BATTLE_STATES.POST_ATTACK ||
      state === BATTLE_STATES.STATUS_EFFECT_CHECK ||
      state === BATTLE_STATES.ITEM_USED ||
      state === BATTLE_STATES.PLAYER_DEFEATED ||
      state === BATTLE_STATES.PLAYER_VICTORY ||
      state === BATTLE_STATES.RUN_ATTEMPT ||
      state === BATTLE_STATES.POST_EXPERIENCE_GAINED ||
      state === BATTLE_STATES.WILD_MON_OUT ||
      state === BATTLE_STATES.MON_FAINTED
  }

  #waitingForPlayerToTakeTurn () {
    return this.#battleStateMachine.currentStateName === BATTLE_STATES.PLAYERS_PLAY
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
    this.#battleStateMachine.setState(BATTLE_STATES.ENEMYS_PLAY)
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

  #introduceEnemyTrainer () {
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} wants to fight!`], () => {
      this.#enemyBattleTrainer.playCharacterDisappearAnimation(() => {
        this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
      })
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
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#enemyBattleTrainer.name.toUpperCase()} sent out ${this.#activeEnemyMon.name}!`, () => {
      this.time.delayedCall(500, () => {
        this.#activeEnemyMon.playMonAppearAnimation(callback, true)
      })
    }, SKIP_ANIMATIONS)          
  }

  #announceWildMon () {
    this.#activeEnemyMon.playMonAppearAnimation(() => {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
      }, SKIP_ANIMATIONS)
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
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Go! ${this.#activePlayerMon.name}!`, () => {
      this.time.delayedCall(500, () => {
        this.#activePlayerMon.playMonAppearAnimation(callback)
      })
    }, SKIP_ANIMATIONS)
  }

  #battleJustStarted () {
    return this.#battlePlayer.characterSpriteShowing
  }

  /**
   * 
   * @returns {boolean}
   */
  #allPlayersHadATurn () {
    return this.#enemyHadATurn() && this.#playerHadATurn()
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
      this.#enemyAttack()
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
      loadMonAssets(this, evolveTo)
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
}