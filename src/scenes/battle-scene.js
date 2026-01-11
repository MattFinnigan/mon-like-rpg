import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../types/direction.js'
import { EnemyBattleMon } from '../battle/mons/enemy-battle-monster.js'
import { PlayerBattleMon } from '../battle/mons/player-battle-monster.js'
import { StateMachine } from '../utils/state-machine.js'
import { SKIP_BATTLE_ANIMATIONS } from '../../config.js'
import { ATTACK_TARGET, AttackManager } from '../battle/attacks/attack-manager.js'
import { Controls } from '../utils/controls.js'
import { DataUtils } from '../utils/data-utils.js'
import { BattleTrainer } from '../battle/characters/battle-trainer.js'
import { EVENT_KEYS } from '../types/event-keys.js'
import { AudioManager } from '../utils/audio-manager.js'
import { BGM_ASSET_KEYS, TRAINER_SPRITES } from '../assets/asset-keys.js'
import { BattlePlayer } from '../battle/characters/battle-player.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { BattleMon } from '../battle/mons/battle-mon.js'
import { BattleCharacter } from '../battle/characters/battle-character.js'
import { ITEM_TYPE_KEY } from '../types/items.js'
import { OPPONENT_TYPES } from '../types/opponent-types.js'


/** @enum {object} */
const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  ENEMY_OUT: 'ENEMY_OUT',
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
  POST_ITEM_USED: 'POST_ITEM_USED'
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
  /** @type {import('../types/typedef.js').Item} */
  #itemToConsume

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
    this.#itemToConsume = null
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
    this.#attackManager = new AttackManager(this, SKIP_BATTLE_ANIMATIONS)
    this.#controls = new Controls(this)

    this.#setUpBattleMons()
    this.#createBattleStateMachine()

    this.events.on(EVENT_KEYS.BATTLE_RUN_ATTEMPT, () => {
      this.#battleStateMachine.setState(BATTLE_STATES.RUN_ATTEMPT)
    })
  }

  update () {
    this.#battleStateMachine.update()
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
  
    if (wasSpaceKeyPresed && this.#needsOkInputToContinue()) {
      this.#battleMenu.handlePlayerInput('OK')
      return
    }

    if (!this.#waitingForPlayerToTakeTurn()) {
      return
    }

    if (this.#controls.wasBackKeyPressed()) {
      this.#battleMenu.handlePlayerInput('CANCEL')
      return
    }

    const selectedDirection = this.#controls.getDirectionKeyJustPressed()
    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection)
    }

    if (wasSpaceKeyPresed) {
      this.#battleMenu.handlePlayerInput('OK')

      if (!this.#playerJustSelectedAnAttack() && !this.#playerJustSelectedAnItem()) {
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
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${mon.name} used ${attk.name}!`, callback, SKIP_BATTLE_ANIMATIONS)
  }

  /**
   * 
   * @returns {import('../types/typedef.js').Attack}
   */
  #getPlayerAttack () {
    return this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
  }

  /**
   * @param {BattleMon} attacker 
   * @param {import('../types/typedef.js').Attack} attk 
   * @param {BattleMon} defender 
   */
  #applyAttackToMon (attacker, attk, defender) {
    const res = defender.receiveAttackAndCalculateDamage(attacker, attk)
    this.#lastAttackResult = res
    return res
  }

  /**
   * 
   * @param {import('../types/typedef.js').Attack} attk
   * @param {import('../types/typedef.js').PostAttackResult} result
   */
  #playPlayerAttackSequence (attk, result) {
    const waitTime = result.damageTaken > 0 ? 500 : 0

    this.time.delayedCall(waitTime, () => {
      this.#attackManager.playAttackAnimation(
        attk.animationName,
        ATTACK_TARGET.ENEMY,
        () => this.#playEnemyDamageTakenAnimation(result),
        result.damageTaken === 0 || SKIP_BATTLE_ANIMATIONS
      )
    })
  }

  /**
   * 
   * @param {import('../types/typedef.js').PostAttackResult} result 
   */
  #playEnemyDamageTakenAnimation (result) {
    this.#activeEnemyMon.playMonTakeDamageAnimation(() => {
      this.#activeEnemyMon.takeDamage(result.damageTaken, () => {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
      })
    }, result.damageTaken === 0 || SKIP_BATTLE_ANIMATIONS)
  }


  #playerAttack () {
    const attk = this.#getPlayerAttack()
    this.#announceAttack(this.#activePlayerMon, attk, () => {
      const result = this.#applyAttackToMon(this.#activePlayerMon, attk, this.#activeEnemyMon)
      this.#playPlayerAttackSequence(attk, result)
    })
  }

  /**
   * 
   * @returns {import('../types/typedef.js').Attack}
   */
  #getEnemyAttack () {
    return this.#activeEnemyMon.attacks[0]
  }

  /**
   * 
   * @param {import('../types/typedef.js').Attack} attk
   * @param {import('../types/typedef.js').PostAttackResult} result
   */
  #playEnemyAttackSequence (attk, result) {
    this.#attackManager.playAttackAnimation(
      attk.animationName,
      ATTACK_TARGET.PLAYER,
      () => this.#playPlayerDamageTakenAnimation(result),
      result.damageTaken === 0
    )
  }

  /**
   * 
   * @param {import('../types/typedef.js').PostAttackResult} result 
   */
  #playPlayerDamageTakenAnimation (result) {
    this.#activePlayerMon.playMonTakeDamageAnimation(() => {
      this.#activePlayerMon.takeDamage(result.damageTaken, () => {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
      })
    }, result.damageTaken === 0)
  }

  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      return
    }

    const attk = this.#getEnemyAttack()
    this.#announceAttack(this.#activeEnemyMon, attk, () => {
      const result = this.#applyAttackToMon(this.#activeEnemyMon, attk, this.#activePlayerMon)
      this.#playEnemyAttackSequence(attk, result)
    })
  }

  /**
   * 
   * @param {() => void} callback 
   */
  #announceAttackEffects (callback) {
    let postAttackMsgs = []
    const {
      wasCriticalHit,
      wasSuperEffective,
      wasImmune,
      wasResistant
    } = this.#lastAttackResult

    if (wasCriticalHit) {
      postAttackMsgs.push('A critical hit!')
    }
    if (wasSuperEffective) {
      postAttackMsgs.push(`It's super effective!`)
    }
    if (wasResistant) {
      postAttackMsgs.push(`It's not very effective...`)
    }
    if (wasImmune) {
      postAttackMsgs.push(`But nothing happened!`)
    }

    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(postAttackMsgs, callback, SKIP_BATTLE_ANIMATIONS)
  }

  #playEnemyFaintedSequence () {
    const postDeathMsgs = [this.#calculateExperienceEarned()]
    this.#activeEnemyMon.playDeathAnimation(() => {
  
      if (this.#opponentIsWildMon()) {
        postDeathMsgs.unshift(`Wild ${this.#activeEnemyMon.name} fainted!`)
        this.#audioManager.playBgm(this.#victoryBgmKey)
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(postDeathMsgs, () => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        }, SKIP_BATTLE_ANIMATIONS)
        return
      }

      this.#enemyBattleTrainer.redrawRemainingMonsGameObject()
      postDeathMsgs.unshift(`Foe's ${this.#activeEnemyMon.name} fainted!`)
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(postDeathMsgs, () => {
        this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
      }, SKIP_BATTLE_ANIMATIONS)
    })
  }

  /**
   * 
   * @returns {string}
   */
  #calculateExperienceEarned () {
    return `${this.#activePlayerMon.name} gained 32 experience points!`
  }

  #playPlayerFaintedSequence () {
    this.#battlePlayer.redrawRemainingMonsGameObject(true)
    this.#activePlayerMon.playDeathAnimation(() => {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`], () => {
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
      }, SKIP_BATTLE_ANIMATIONS)
    })
  }

  #postBattleSequenceCheck() {
    this.#announceAttackEffects(() => {
      if (this.#activeEnemyMon.isFainted) {
        this.#playEnemyFaintedSequence()
        return
      }

      if (this.#activePlayerMon.isFainted) {
        this.#playPlayerFaintedSequence()
        return
      }
  
      this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
    })
  }

  #transitionToNextScene () {
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
        this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        this.#bringOutPlayerTrainer()

        if (this.#opponentIsWildMon()) {
          this.#battleStateMachine.setState(BATTLE_STATES.WILD_MON_OUT)
          return
        }

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
        this.#battleMenu.hideItemMenu()
        if (this.#allPlayersHadATurn()) {
          this.#resetTurnTracker()
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYERS_PLAY)
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
        this.#postBattleSequenceCheck()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ITEM_USED,
      onEnter: () => {
        if (this.#itemToConsume) {
          this.events.emit(EVENT_KEYS.CONSUME_ITEM, this.#itemToConsume)
          this.#itemToConsume = null
        }
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ITEM_USED,
      onEnter: () => {
        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
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
          }, SKIP_BATTLE_ANIMATIONS)
        } else {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Couldn't get away!`], () => {
            this.#battleMenu.showMainBattleMenu()
          }, SKIP_BATTLE_ANIMATIONS)
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
  }

  #playerUseItem () {
    this.#battleMenu.hideItemMenu()
    this.#announceItemUsed(this.#battlePlayer, this.#activePlayerItem, () => {
      this.#playItemEffect(this.#activePlayerMon, this.#activePlayerItem, () => {
        this.#battleStateMachine.setState(BATTLE_STATES.POST_ITEM_USED)
      })
    })
  }

  /**
   * 
   * @param {BattleCharacter} character 
   * @param {import('../types/typedef.js').Item} item 
   * @param {() => void} callback 
   */
  #announceItemUsed (character, item, callback) {
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${character.name} used ${item.name}.`, callback, SKIP_BATTLE_ANIMATIONS)
  }

  /**
   * 
   * @param {BattleMon} battleMon 
   * @param {import('../types/typedef.js').Item} item 
   * @param {() => void} callback 
   */
  #playItemEffect (battleMon, item, callback) {
    // todo play animation
    this.time.delayedCall(1000, () => {
      switch (item.typeKey) {
        case ITEM_TYPE_KEY.HEALING:
          battleMon.healHp(item.value, () => {
            this.#itemToConsume = item
            this.#battleStateMachine.setState(BATTLE_STATES.ITEM_USED)
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${battleMon.name} was healed for ${item.value} hitpoints`], callback, SKIP_BATTLE_ANIMATIONS)
          })
          break
        default:
          this.#battleStateMachine.setState(BATTLE_STATES.ITEM_USED)
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(['But nothing happened...'], callback, SKIP_BATTLE_ANIMATIONS)
          break
      }
    })
  }
      
  #setUpBattleMons () {
    const partyBaseMons = this.#player.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
    this.#playerMons = this.#player.partyMons.map((pm, i) => {
      return new PlayerBattleMon({
        scene: this,
        monDetails: pm,
        baseMonDetails: partyBaseMons[i],
        skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
      })
    })

    if (!this.#opponentIsWildMon()) {
      const enemyBaseMons = this.#enemyTrainer.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
    
      this.#opponentMons = this.#enemyTrainer.partyMons.map((pm, i) => {
        return new EnemyBattleMon({
          scene: this,
          monDetails: pm,
          baseMonDetails: enemyBaseMons[i],
          skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
        })
      })
      return
    }

    this.#opponentMons = [
      new EnemyBattleMon({
        scene: this,
        monDetails: this.#generatedMon.mon,
        baseMonDetails: this.#generatedMon.baseMon,
        skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
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
      state === BATTLE_STATES.ENEMY_OUT ||
      state === BATTLE_STATES.ENEMY_MON_OUT ||
      state === BATTLE_STATES.WILD_MON_OUT ||
      state === BATTLE_STATES.POST_ATTACK ||
      state === BATTLE_STATES.ITEM_USED ||
      state === BATTLE_STATES.PLAYER_DEFEATED ||
      state === BATTLE_STATES.PLAYER_VICTORY ||
      state === BATTLE_STATES.RUN_ATTEMPT
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
        skipBattleAnimations: SKIP_BATTLE_ANIMATIONS,
        assetKey: this.#enemyTrainer.assetKey
      })
    }
    this.#battlePlayer = new BattlePlayer(this, this.#player, this.#playerMons, {
      assetKey: TRAINER_SPRITES.RED,
      skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
    })
  }

  #bringOutPlayerTrainer () {
    this.#battlePlayer.playCharacterAppearAnimation()
  }

  #introduceEnemyTrainer () {
    this.#enemyBattleTrainer.playCharacterAppearAnimation(() => {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} wants to fight!`], () => {
        this.#enemyBattleTrainer.playCharacterDisappearAnimation(() => {
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
        })
      }, SKIP_BATTLE_ANIMATIONS)
    })
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
    }, SKIP_BATTLE_ANIMATIONS)          
  }

  #announceWildMon () {
    this.#activeEnemyMon.playMonAppearAnimation(() => {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
        this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
      }, SKIP_BATTLE_ANIMATIONS)
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
    }, SKIP_BATTLE_ANIMATIONS)
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
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, callback, SKIP_BATTLE_ANIMATIONS)
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
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, callback, SKIP_BATTLE_ANIMATIONS)
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
}