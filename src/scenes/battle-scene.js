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
import { OPPONENT_TYPE } from '../common/opponent_type.js'

const BATTLE_STATES = Object.freeze({
  INTRO: 'INTRO',
  PRE_BATTLE_INFO: 'PRE_BATTLE_INFO',
  BRING_OUT_MON: 'BRING_OUT_MON',
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
  /** @type {import('../types/typedef.js').Opponent} */
  #opponent
  /** @type {number} */
  #currentOpponentMonIndex

  constructor () {
    super({
      key: SCENE_KEYS.BATTLE_SCENE
    })
  }
  
  /**
   * 
   * @param {object} data
   * @param {import('../types/typedef.js').Opponent} data.opponent
   */
  init (data) {
    this.#activePlayerAttackIndex = -1
    this.#opponent = data.opponent
    this.#currentOpponentMonIndex = 0
  }
  
  preload () {
    console.log(`[${BattleScene.name}:preload] invoked`)
  }

  create () {
    this.cameras.main.setBackgroundColor('#fff')
    console.log(`[${BattleScene.name}:create] invoked`)

    const opponentsFirstMon = this.#opponent.mons[this.#currentOpponentMonIndex]

    let p2Mon = null
    if (this.#opponent.type !== OPPONENT_TYPE.WILD_MON) {
      p2Mon = DataUtils.getMonDetails(this, opponentsFirstMon.id)
    } else {
      p2Mon = DataUtils.generateWildMon(this, this.#opponent.encounterArea)
      this.#opponent.mons.push(p2Mon)
    }

    const P2_BASE_MON = DataUtils.getBaseMonDetails(this, p2Mon.monIndex)

    this.#activeEnemyMon = new EnemyBattleMon({
      scene: this,
      monDetails: p2Mon,
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

    this.#battleMenu = new BattleMenu(this, this.#activePlayerMon)
    this.#createBattleStateMachine()
    this.#attackManager = new AttackManager(this, SKIP_BATTLE_ANIMATIONS)
    this.#controls = new Controls(this)

    this.events.on('player:attemptToRun', () => {
      this.#battleStateMachine.setState(BATTLE_STATES.RUN_ATTEMPT)
    })
  }

  update () {
    this.#battleStateMachine.update()
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
    if (wasSpaceKeyPresed &&
        (this.#battleStateMachine.currentStateName === BATTLE_STATES.PRE_BATTLE_INFO ||
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
    if (this.#activeEnemyMon.isFainted) {
      this.#activeEnemyMon.playDeathAnimation(() => {
        this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} fainted!`, `${this.#activePlayerMon.name} gained 32 experience points!`], () => {
          this.#battleStateMachine.setState(BATTLE_STATES.FINISHED)
        }, SKIP_BATTLE_ANIMATIONS)
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
        this.#battleStateMachine.setState(BATTLE_STATES.PRE_BATTLE_INFO)
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.PRE_BATTLE_INFO,
      onEnter: () => {
        this.#activeEnemyMon.playMonAppearAnimation(() => {
          this.#activeEnemyMon.playMonHealthBarContainerAppearAnimation(() => {
            this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} appeared!`], () => {
              // wait for txt anim
              this.time.delayedCall(500, () => {
                this.#battleStateMachine.setState(BATTLE_STATES.BRING_OUT_MON)
              })
            }, SKIP_BATTLE_ANIMATIONS)
          })
        })
      }
    })
  
    this.#battleStateMachine.addState({
      name: BATTLE_STATES.BRING_OUT_MON,
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