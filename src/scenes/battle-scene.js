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
import { BattleTrainer } from '../battle/battle-trainer.js'
import { EVENT_KEYS } from '../common/event-keys.js'
import { exhaustiveGuard } from '../utils/guard.js'
import { AudioManager } from '../utils/audio-manager.js'
import { BGM_ASSET_KEYS } from '../assets/asset-keys.js'
import { OPPONENT_TYPES } from '../common/opponent-types.js'

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
  RUN_ATTEMPT: 'RUN_ATTEMPT'
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
  /** @type {number} */
  #currentOpponentMonIndex
  /** @type {BattleTrainer} */
  #activeEnemyTrainer
  /** @type {import('../types/typedef.js').Mon[]} */
  #opponentMons
  /** @type {OPPONENT_TYPES} */
  #opponentType
  /** @type {import('../types/typedef.js').Trainer} */
  #opponentTrainer
  /** @type {AudioManager} */
  #audioManager

  constructor () {
    super({
      key: SCENE_KEYS.BATTLE_SCENE
    })
    this.#activePlayerAttackIndex = -1
    this.#currentOpponentMonIndex = 0
  }
  
  /**
   * 
   * @param {object} data
   * @param {OPPONENT_TYPES} data.type
   * @param {import('../types/typedef.js').Trainer} data.trainer
   * @param {import('../types/typedef.js').WildMon} data.wildMon
   */
  init (data) {
    this.#opponentType = data.type
    switch (this.#opponentType) {
      case OPPONENT_TYPES.WILD_ENCOUNTER:
        this.#opponentMons = [DataUtils.generateWildMon(this, data.wildMon.encounterArea)]
        break
      case OPPONENT_TYPES.TRAINER:
        this.#opponentTrainer = data.trainer
        this.#opponentMons = data.trainer.mons
        break
      case OPPONENT_TYPES.GYM_LEADER:
        break
      default:
        exhaustiveGuard(this.#opponentType)
    }
  }
  
  preload () {
    console.log(`[${BattleScene.name}:preload] invoked`)
  }

  create () {
    this.cameras.main.setBackgroundColor('#fff')
    console.log(`[${BattleScene.name}:create] invoked`)

    const P2_MON = this.#opponentMons[this.#currentOpponentMonIndex]

    const P2_BASE_MON = DataUtils.getBaseMonDetails(this, P2_MON.monIndex)

    this.#activeEnemyMon = new EnemyBattleMon({
      scene: this,
      monDetails: P2_MON,
      baseMonDetails: P2_BASE_MON,
      skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
    })

    const P1_MON = DataUtils.getMonDetails(this, 1)
    const P1_BASE_MON = DataUtils.getBaseMonDetails(this, P1_MON.monIndex)

    this.#activePlayerMon = new PlayerBattleMon({
      scene: this,
      monDetails: P1_MON,
      baseMonDetails: P1_BASE_MON,
      skipBattleAnimations: SKIP_BATTLE_ANIMATIONS
    })
    this.#audioManager = this.registry.get('audio')

    this.#battleMenu = new BattleMenu(this, this.#activePlayerMon)
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
    const attk = this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#activePlayerMon.name} used ${attk.name}!`, () => {
      this.time.delayedCall(500, () => {
        this.#attackManager.playAttackAnimation(attk.animationName, ATTACK_TARGET.ENEMY, () => {
          this.#activeEnemyMon.playMonTakeDamageAnimation(() => {
            this.#activeEnemyMon.takeDamage(this.#activePlayerMon.baseAttack, () => {
              this.#enemyAttack()
            })
          })
        })
      })
    }, SKIP_BATTLE_ANIMATIONS)
  }

  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
      return
    }
    const attk = this.#activeEnemyMon.attacks[0]
    this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Foe ${this.#activeEnemyMon.name} used ${attk.name}!`, () => {
      this.time.delayedCall(500, () => {
        this.#attackManager.playAttackAnimation(attk.animationName, ATTACK_TARGET.PLAYER, () => {
          this.#activePlayerMon.playMonTakeDamageAnimation(() => {
            this.#activePlayerMon.takeDamage(this.#activeEnemyMon.baseAttack, () => {
              this.#battleStateMachine.setState(BATTLE_STATES.POST_ATTACK)
            })
          })
        })
      })
    }, SKIP_BATTLE_ANIMATIONS)
  }

  #postBattleSequenceCheck() {
    let faintedMsg = `Wild ${this.#activeEnemyMon.name} fainted!`
    let victoryBgmKey = BGM_ASSET_KEYS[this.#opponentType + '_VICTORY']

    if (this.#opponentType !== OPPONENT_TYPES.WILD_ENCOUNTER) {
      faintedMsg = `Foe ${this.#activeEnemyMon.name} fainted!`
    }

    if (this.#activeEnemyMon.isFainted) {
      this.#activeEnemyMon.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([faintedMsg], () => {
          // TODO # of mon check change state etc etc
          this.#audioManager.playBgm(victoryBgmKey)
          this.time.delayedCall(100, () => {
              this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} gained 32 experience points!`], () => {
              console.log('???')
              this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
            })
          })
        })
      })
      return
    }

    if (this.#activePlayerMon.isFainted) {
      this.#activePlayerMon.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`, `YOU have no usable Pokemon!`, `YOU whited out!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        }, SKIP_BATTLE_ANIMATIONS)
      })
      return
    }
    this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
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
          this.#activeEnemyTrainer = new BattleTrainer(this, this.#opponentTrainer, SKIP_BATTLE_ANIMATIONS)
        }
        this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        if (this.#opponentType === OPPONENT_TYPES.WILD_ENCOUNTER) {
          this.#battleStateMachine.setState(BATTLE_STATES.WILD_MON_OUT)
          return
        }
        this.#activeEnemyTrainer.playTrainerAppearAnimation(() => {
          this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#opponentTrainer.trainerType.toUpperCase()} ${this.#opponentTrainer.name.toUpperCase()} wants to fight!`], () => {
            // wait for txt anim
            this.time.delayedCall(500, () => {
              this.#activeEnemyTrainer.playTrainerDisappearAnimation(() => {
                this.#battleStateMachine.setState(BATTLE_STATES.ENEMY_MON_OUT)
              })
            })
          }, SKIP_BATTLE_ANIMATIONS)
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.ENEMY_MON_OUT,
      onEnter: () => {
        this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`${this.#opponentTrainer.name.toUpperCase()} sent out ${this.#activeEnemyMon.name}!`, () => {
          // wait for txt anim
          this.time.delayedCall(500, () => {
            this.#activeEnemyMon.playMonAppearAnimation(() => {
              this.#activeEnemyMon.playMonHealthBarContainerAppearAnimation(() => {
                // wait for txt anim
                this.time.delayedCall(500, () => {
                  this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_OUT)
                })
              })
            }, true)
          })
        }, SKIP_BATTLE_ANIMATIONS)
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.WILD_MON_OUT,
      onEnter: () => {
        this.#activeEnemyMon.playMonAppearAnimation(() => {
          this.#activeEnemyMon.playMonHealthBarContainerAppearAnimation(() => {
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
              // wait for txt anim
              this.time.delayedCall(500, () => {
                this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_MON_OUT)
              })
            }, SKIP_BATTLE_ANIMATIONS)
          })
        })
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PLAYER_MON_OUT,
      onEnter: () => {
        // wait for player mon to appear, notify player of mon
        this.#battleMenu.updateInfoPanelMessagesNoInputRequired(`Go! ${this.#activePlayerMon.name}!`, () => {
          // wait for txt anim
          this.time.delayedCall(1000, () => {
            this.#activePlayerMon.playMonAppearAnimation(() => {
              // TODO wait for mon cry
              this.time.delayedCall(500, () => {
                this.#activePlayerMon.playMonHealthBarContainerAppearAnimation(() => {
                  this.time.delayedCall(500, () => {
                    this.#battleStateMachine.setState(BATTLE_STATES.PLAYER_INPUT)
                  })
                })
              })
            })
          })
        }, SKIP_BATTLE_ANIMATIONS)
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
        this.#playerAttack()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.POST_ATTACK,
      onEnter: () => {
        this.#postBattleSequenceCheck()
      }
    })

    this.#battleStateMachine.addState({
      name: BATTLE_STATES.FINISHED,
      onEnter: () => {
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
}