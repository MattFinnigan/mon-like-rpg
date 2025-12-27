import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { BITMAP_NEGATIVE_Y_PADDING } from '../lib/consts.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../common/direction.js'
import { EnemyBattleMon } from '../battle/mons/enemy-battle-monster.js'
import { PlayerBattleMon } from '../battle/mons/player-battle-monster.js'

export class BattleScene extends Phaser.Scene {
  /** @type {BattleMenu} */
  #battleMenu
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  #cursorKeys
  /** @type {EnemyBattleMon} */
  #activeEnemyMon
  /** @type {PlayerBattleMon} */
  #activePlayerMon

  constructor () {
    super({
      key: SCENE_KEYS.BATTLE_SCENE
    })
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
        currentHp: 19,
        maxHp: 19,
        currentLevel: 100,
        attackIds: [],
        baseAttack: 5
      }
    })

    this.#activePlayerMon = new PlayerBattleMon({
      scene: this,
      monDetails: {
        name: P1_MON,
        assetKey: MON_BACK_ASSET_KEYS[P1_MON + '_BACK'],
        assetFrame: 0,
        currentHp: 19,
        maxHp: 19,
        currentLevel: 15,
        attackIds: [],
        baseAttack: 5
      }
    })

    this.#battleMenu = new BattleMenu(this)
    this.#battleMenu.showMainBattleMenu()

    this.#cursorKeys = this.input.keyboard.createCursorKeys()

    this.#activeEnemyMon.takeDamage(7, () => {
      this.#activePlayerMon.takeDamage(5)
    })
  }

  update () {
    const wasSpaceKeyPresed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
    if (wasSpaceKeyPresed) {
      this.#battleMenu.handlePlayerInput('OK')

      // check if player selected an attack, update display text
      if (this.#battleMenu.selectedAttack === undefined) {
        return
      }
      console.log('Player selected the following move ' + this.#battleMenu.selectedAttack)
      this.#battleMenu.hideMonAttackSubMenu()
      this.#battleMenu.updateInfoPanelMessagesAndWaitForInput(['He did the thing!'], () => {
        this.#battleMenu.showMainBattleMenu()
      })
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

}