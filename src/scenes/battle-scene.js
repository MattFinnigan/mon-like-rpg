import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../common/direction.js'
import { EnemyBattleMon } from '../battle/mons/enemy-battle-monster.js'
import { PlayerBattleMon } from '../battle/mons/player-battle-monster.js'
import { StateMachine } from '../utils/state-machine.js'
import { SKIP_BATTLE_ANIMATIONS } from '../../config.js'
import { ATTACK_TARGET, AttackManager } from '../battle/attacks/attack-manager.js'
import { Controls } from '../utils/controls.js'
import { DataUtils } from '../utils/data-utils.js'
import { BattleTrainer } from '../battle/characters/battle-trainer.js'
import { EVENT_KEYS } from '../common/event-keys.js'
import { AudioManager } from '../utils/audio-manager.js'
import { BGM_ASSET_KEYS, TRAINER_SPRITES } from '../assets/asset-keys.js'
import { OPPONENT_TYPES } from '../common/opponent-types.js'
import { BattlePlayer } from '../battle/characters/battle-player.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'

/** @enum {object} */
const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  ENEMY_OUT: 'ENEMY_OUT',
  PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',
  WILD_MON_OUT: 'WILD_MON_OUT',
  ENEMY_MON_OUT: 'ENEMY_MON_OUT',
  PLAYER_MON_OUT: 'PLAYER_MON_OUT',
  PLAYER_INPUT: 'PLAYER_INPUT',
  ENEMY_INPUT: 'ENEMY_INPUT',
  BATTLE: 'BATTLE',
  POST_ATTACK: 'POST_ATTACK',
  FINISHED: 'FINISHED',
  RUN_ATTEMPT: 'RUN_ATTEMPT',
  ENEMY_CHOOSE_MON: 'ENEMY_CHOOSE_MON',
  PLAYER_CHOOSE_MON: 'PLAYER_CHOOSE_MON',
  PLAYER_VICTORY: 'PLAYER_VICTORY',
  PLAYER_DEFEATED: 'PLAYER_DEFEATED'
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
    this.#player = null
    this.#playerMons = []
    this.#playersThatHadATurn = []
  }
  
  /**
   * 
   * @param {import('../types/typedef.js').BattleSceneConfig} battleSceneConfig 
   */
  init (battleSceneConfig) {
    console.log(`[${BattleScene.name}:init] invoked`)
    this.#opponentType = battleSceneConfig.type
    this.#enemyTrainer = battleSceneConfig.trainer
    this.#player = {
      name: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_NAME),
      partyMons: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS),
      inventory: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY),
    }
    this.#generatedMon = battleSceneConfig.generatedMon
  }
  
  preload () {
    console.log(`[${BattleScene.name}:preload] invoked`)

    this.#victoryBgmKey = BGM_ASSET_KEYS.WILD_ENCOUNTER_VICTORY
    if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
      this.#victoryBgmKey = BGM_ASSET_KEYS.TRAINER_VICTORY
    }
  
    this.load.audio(BGM_ASSET_KEYS[this.#victoryBgmKey], [`assets/audio/bgm/${this.#victoryBgmKey}.flac`])
  }

  create () {
    console.log(`[${BattleScene.name}:create] invoked`)
    this.cameras.main.setBackgroundColor('#fff')
    this.#audioManager = this.registry.get('audio')

    this.#setUpBattleMons()
    this.#battleMenu = new BattleMenu(this)
    this.#createBattleStateMachine()

    this.#attackManager = new AttackManager(this, SKIP_BATTLE_ANIMATIONS)
    this.#controls = new Controls(this)

    this.events.on(EVENT_KEYS.BATTLE_RUN_ATTEMPT, () => {
      this.#battleStateMachine.setState(BATTLE_STATES.RUN_ATTEMPT)
    })
  }

  update () {
    this.#battleStateMachine.update()
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
    if (wasSpaceKeyPresed &&
        (this.#battleStateMachine.currentStateName === BATTLE_STATES.PRE_BATTLE_INFO ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.ENEMY_OUT ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.ENEMY_MON_OUT ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.WILD_MON_OUT ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.POST_ATTACK ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.PLAYER_DEFEATED ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.PLAYER_VICTORY ||
          this.#battleStateMachine.currentStateName === BATTLE_STATES.RUN_ATTEMPT)
      ) {
      this.#battleMenu.handlePlayerInput('OK')
      return
    }
    if (this.#battleStateMachine.currentStateName !== BATTLE_STATES.PLAYER_INPUT) {
      return
    }

    if (wasSpaceKeyPresed) {
      this.#battleMenu.handlePlayerInput('OK')

      // check if player selected an attack, update display text
      if (this.#battleMenu.selectedAttack === undefined) {
        return
      }
      this.#activePlayerAttackIndex = this.#battleMenu.selectedAttack

      if (!this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]) {
        return
      }

      this.#battleMenu.hideMonAttackSubMenu()
      this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_INPUT)
    }

    if (this.#controls.wasBackKeyPressed()) {
      this.#battleMenu.handlePlayerInput('CANCEL')
      return
    }

    const selectedDirection = this.#controls.getDirectionKeyJustPressed()
    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection)
    }
  }


  #playerAttack () {
    if (this.#activePlayerMon.isFainted) {
      return
    }
    const attk = this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#activePlayerMon.name} used ${attk.name}!`, () => {
      this.#lastAttackResult = this.#activeEnemyMon.receiveAttackAndCalculateDamage(this.#activePlayerMon, attk)
      const waitForAnims = this.#lastAttackResult.damageTaken > 0 ? 500 : 0
      this.time.delayedCall(waitForAnims, () => {
        this.#attackManager.playAttackAnimation(attk.animationName, ATTACK_TARGET.ENEMY, () => {
          this.#activeEnemyMon.playMonTakeDamageAnimation(() => {
            this.#activeEnemyMon.takeDamage(this.#lastAttackResult.damageTaken, () => {
              this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
            })
          }, this.#lastAttackResult.damageTaken === 0)
        }, this.#lastAttackResult.damageTaken === 0)
      })
    }, SKIP_BATTLE_ANIMATIONS)
  }

  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      return
    }
    const attk = this.#activeEnemyMon.attacks[0]
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Foe's ${this.#activeEnemyMon.name} used ${attk.name}!`, () => {
      this.#lastAttackResult = this.#activePlayerMon.receiveAttackAndCalculateDamage(this.#activeEnemyMon, attk)
      const waitForAnims = this.#lastAttackResult.damageTaken > 0 ? 500 : 0
      this.time.delayedCall(waitForAnims, () => {
        this.#attackManager.playAttackAnimation(attk.animationName, ATTACK_TARGET.PLAYER, () => {
          this.#activePlayerMon.playMonTakeDamageAnimation(() => {
            this.#activePlayerMon.takeDamage(this.#lastAttackResult.damageTaken, () => {
              this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
            })
          }, this.#lastAttackResult.damageTaken === 0)
        }, this.#lastAttackResult.damageTaken === 0)
      })
    }, SKIP_BATTLE_ANIMATIONS)
  }

  #postBattleSequenceCheck() {
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

    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(postAttackMsgs, () => {
      if (this.#activeEnemyMon.isFainted) {
        

        const postDeathMsgs = [`${this.#activePlayerMon.name} gained 32 experience points!`]
        this.#activeEnemyMon.playDeathAnimation(() => {
          if (this.#opponentType === OPPONENT_TYPES.WILD_ENCOUNTER ) {
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
        return
      }

      if (this.#activePlayerMon.isFainted) {
        this.#battlePlayer.redrawRemainingMonsGameObject(true)
        this.#activePlayerMon.playDeathAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`], () => {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
          }, SKIP_BATTLE_ANIMATIONS)
        })
        return
      }
      this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
    }, SKIP_BATTLE_ANIMATIONS)
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
        if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
          this.#enemyBattleTrainer = new BattleTrainer(this, this.#enemyTrainer, this.#opponentMons, {
            skipBattleAnimations: SKIP_BATTLE_ANIMATIONS,
            assetKey: this.#enemyTrainer.assetKey
          })
        }
        this.#battlePlayer = new BattlePlayer(this, this.#player, this.#playerMons, {
          assetKey: TRAINER_SPRITES.RED,
          skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
        })
        this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        this.#battlePlayer.playCharacterAppearAnimation()
        if (this.#opponentType === OPPONENT_TYPES.WILD_ENCOUNTER) {
          this.#battleStateMachine.setState(BATTLE_STATES.WILD_MON_OUT)
          return
        }
        this.#enemyBattleTrainer.playCharacterAppearAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} wants to fight!`], () => {
            this.#enemyBattleTrainer.playCharacterDisappearAnimation(() => {
              this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_CHOOSE_MON)
            })
          }, SKIP_BATTLE_ANIMATIONS)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_CHOOSE_MON,
      onEnter: () => {
        let delayMonOut = 100

        if (this.#activeEnemyMon) {
          this.#activeEnemyMon.hideBattleDetails()
          delayMonOut = SKIP_BATTLE_ANIMATIONS ? delayMonOut : 1000
        }

        this.#enemyBattleTrainer.showRemainingMons()
        this.#activeEnemyMon = this.#opponentMons.find(mon => !mon.isFainted)
        this.#playersThatHadATurn = []

        if (!this.#activeEnemyMon) {
          this.#enemyBattleTrainer.showTrainer()
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_VICTORY)
          return
        }
        
        this.time.delayedCall(delayMonOut, () => {
          this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_OUT)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_MON_OUT,
      onEnter: () => {
        this.#enemyBattleTrainer.hideRemainingMons()
        this.#enemyBattleTrainer.playCharacterDisappearAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#enemyBattleTrainer.name.toUpperCase()} sent out ${this.#activeEnemyMon.name}!`, () => {
            this.time.delayedCall(500, () => {
              this.#activeEnemyMon.playMonAppearAnimation(() => {
                if (this.#battlePlayer.characterSpriteShowing) {
                  this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
                  return
                }
                this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
              }, true)
            })
          }, SKIP_BATTLE_ANIMATIONS)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_MON_OUT,
      onEnter: () => {
        this.#activeEnemyMon.playMonAppearAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
            this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_CHOOSE_MON)
          }, SKIP_BATTLE_ANIMATIONS)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_CHOOSE_MON,
      onEnter: () => {
        let delayMonOut = 100

        if (this.#activePlayerMon) {
          this.#activePlayerMon.hideBattleDetails()
          delayMonOut = SKIP_BATTLE_ANIMATIONS ? delayMonOut : 1000
        }
  
        this.#battlePlayer.showRemainingMons()
        this.#activePlayerMon = this.#playerMons.find(mon => !mon.isFainted)
        this.#playersThatHadATurn = []

        if (!this.#activePlayerMon) {
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_DEFEATED)
          return
        }
        this.time.delayedCall(delayMonOut, () => {
          this.#battleMenu.activePlayerMon = this.#activePlayerMon
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_OUT)
        })

      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_MON_OUT,
      onEnter: () => {
        this.#battlePlayer.hideRemainingMons()
        this.#battlePlayer.playCharacterDisappearAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Go! ${this.#activePlayerMon.name}!`, () => {
            this.time.delayedCall(500, () => {
                this.#activePlayerMon.playMonAppearAnimation(() => {
                this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
              })
            })
          }, SKIP_BATTLE_ANIMATIONS)
        })
      }
    })
    
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_INPUT,
      onEnter: () => {
        this.#battleMenu.showMainBattleMenu()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_INPUT,
      onEnter: () => {
        this.#battleStateMachine.setState(BATTLE_STATES.BATTLE)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BATTLE,
      onEnter: () => {
        if (this.#playersThatHadATurn.length === 2) {
          this.#playersThatHadATurn = []
          this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
          return
        }
  
        if (this.#playersThatHadATurn.length === 0) {
          if (this.#activeEnemyMon.monStats.speed > this.#activePlayerMon.monStats.speed) {
            this.#playersThatHadATurn.push(BATTLE_PLAYERS.ENEMY)
            this.#enemyAttack()
            return
          }
          this.#playersThatHadATurn.push(BATTLE_PLAYERS.PLAYER)
          this.#playerAttack()
          return
        }
        
        if (this.#playersThatHadATurn[0] === BATTLE_PLAYERS.ENEMY) {
          this.#playersThatHadATurn.push(BATTLE_PLAYERS.PLAYER)
          this.#playerAttack()
          return
        }

        if (this.#playersThatHadATurn[0] === BATTLE_PLAYERS.PLAYER) {
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
      name: BATTLE_STATES.PLAYER_VICTORY,
      onEnter: () => {
        const msgs = []
        if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
          msgs.push(`${this.#enemyBattleTrainer.trainerType.toUpperCase()} ${this.#enemyBattleTrainer.name.toUpperCase()} was defeated!`)
          msgs.push(`"${this.#enemyTrainer.defeatedMsg}"`)
          msgs.push(`You were paid $${this.#enemyTrainer.rewardOnVictory} as winnings!`)
        }
        this.#audioManager.playBgm(this.#victoryBgmKey)
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, () => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        }, SKIP_BATTLE_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_DEFEATED,
      onEnter: () => {
        this.#battlePlayer.showTrainer()
        const msgs = [`YOU have no more usable Pokemon!`]
        if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
          msgs.push(`You paid out $${this.#enemyTrainer.payOutOnDefeat}...`)
        }
        msgs.push(`YOU whited out!`)
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(msgs, () => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        }, SKIP_BATTLE_ANIMATIONS)
        return
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FINISHED,
      onEnter: () => {
        this.#playersThatHadATurn = []
        this.#transitionToNextScene()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.RUN_ATTEMPT,
      onEnter: () => {
        const runSucceeded = 1
        if (runSucceeded) {
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
    
    this.#battleStateMachine.setState(BATTLE_STATES.INTRO)
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

    if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
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
}