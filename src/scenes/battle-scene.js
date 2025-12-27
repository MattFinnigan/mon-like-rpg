import { MON_ASSET_KEYS, MON_BACK_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../common/direction.js'
import { EnemyBattleMon } from '../battle/mons/enemy-battle-monster.js'
import { PlayerBattleMon } from '../battle/mons/player-battle-monster.js'
import { StateMachine } from '../utils/state-machine.js'

export class BattleScene extends Phaser.Scene {
  /** @type {BattleMenu} */
  #battleMenu
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  #cursorKeys
  /** @type {EnemyBattleMon} */
  #activeEnemyMon
  /** @type {PlayerBattleMon} */
  #activePlayerMon
  /** @type {number} */
  #activePlayerAttackIndex
  /** @type {StateMachine} */
  #battleStateMachine

  constructor () {
    super({
      key: SCENE_KEYS.BATTLE_SCENE
    })
  }
  
  init () {
    this.#activePlayerAttackIndex = -1
  }
  
  preload () {
    console.log(`[${BattleScene.name}:preload] invoked`)
  }

  create () {
    console.log(`[${BattleScene.name}:create] invoked`)
    const P1_MON = 'PIKACHU'
    const P2_MON = 'BLASTOISE'

    this.#activeEnemyMon = new EnemyBattleMon({
      scene: this,
      monDetails: {
        name: P2_MON,
        assetKey: MON_ASSET_KEYS[P2_MON],
        assetFrame: 0,
        currentHp: 20,
        maxHp: 20,
        currentLevel: 100,
        attackIds: [2],
        baseAttack: 20
      }
    })

    this.#activePlayerMon = new PlayerBattleMon({
      scene: this,
      monDetails: {
        name: P1_MON,
        assetKey: MON_BACK_ASSET_KEYS[P1_MON + '_BACK'],
        assetFrame: 0,
        currentHp: 20,
        maxHp: 20,
        currentLevel: 15,
        attackIds: [1, 2],
        baseAttack: 5
      }
    })

    this.#battleMenu = new BattleMenu(this, this.#activePlayerMon)
    this.#battleMenu.showMainBattleMenu()

    this.#battleStateMachine = new StateMachine('battle', this)
    this.#battleStateMachine.addState({
      name: 'INTRO',
      onEnter: () => {
        this.time.delayedCall(1000, () => {
          this.#battleStateMachine.setState('BATTLE')
        })
      }
    })
    this.#battleStateMachine.addState({
      name: 'BATTLE'
    })
    this.#battleStateMachine.setState('INTRO')

    this.#cursorKeys = this.input.keyboard.createCursorKeys()
  }

  update () {
    const wasSpaceKeyPresed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
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
      this.#handleBattleSequence()
    }

    if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift)) {
      this.#battleMenu.handlePlayerInput('CANCEL')
      return
    }

    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE
    if (this.#cursorKeys.left.isDown) {
      selectedDirection = DIRECTION.LEFT
    } else if (this.#cursorKeys.right.isDown) {
      selectedDirection = DIRECTION.RIGHT
    } else if (this.#cursorKeys.up.isDown) {
      selectedDirection = DIRECTION.UP
    } else if (this.#cursorKeys.down.isDown) {
      selectedDirection = DIRECTION.DOWN
    }

    if (selectedDirection !== DIRECTION.NONE) {
      this.#battleMenu.handlePlayerInput(selectedDirection)
    }
  }

  #handleBattleSequence () {
    this.#playerAttack()
  }

  #playerAttack () {
    const attk = this.#activePlayerMon.attacks[this.#activePlayerAttackIndex]
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} used ${attk.name}!`], () => {
      this.time.delayedCall(500, () => {
        this.#activeEnemyMon.takeDamage(this.#activePlayerMon.baseAttack, () => {
          this.#enemyAttack()
        })
      })
    })
  }

  #enemyAttack() {
    if (this.#activeEnemyMon.isFainted) {
      this.#postBattleSequenceCheck()
      return
    }
    const attk = this.#activeEnemyMon.attacks[0]
    this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Foe ${this.#activeEnemyMon.name} used ${attk.name}!`], () => {
      this.time.delayedCall(500, () => {
        this.#activePlayerMon.takeDamage(this.#activeEnemyMon.baseAttack, () => {
          this.#postBattleSequenceCheck()
        })
      })
    })
  }

  #postBattleSequenceCheck() {
    if (this.#activeEnemyMon.isFainted) {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`Wild ${this.#activeEnemyMon.name} fainted!`, `${this.#activePlayerMon.name} gained 32 experience points!`], () => {
        // TODO
        this.#transitionToNextScene()
      })
      return
    }

    if (this.#activePlayerMon.isFainted) {
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput([`${this.#activePlayerMon.name} fainted!`, `YOU have no usable Pokemon!`, `YOU whited out!`], () => {
        // TODO
        this.#transitionToNextScene()
      })
      return
    }
    this.#battleMenu.showMainBattleMenu()
  }

  #transitionToNextScene () {
    this.cameras.main.fadeOut(500, 255, 255, 255)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENE_KEYS.BATTLE_SCENE)
    })
  }
}