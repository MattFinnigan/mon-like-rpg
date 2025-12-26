import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { PADDING, BITMAP_NEGATIVE_Y_PADDING } from '../lib/consts.js'
import { BattleMenu } from '../battle/ui/menu/battle-menu.js'
import { DIRECTION } from '../common/direction.js'

export class BattleScene extends Phaser.Scene {
  /** @type {BattleMenu} */
  #battleMenu
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  #cursorKeys
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

    const p1MonImg = this.add.image(PADDING, 0, MON_BACK_ASSET_KEYS[P1_MON + '_BACK']).setOrigin(0)
    p1MonImg.setY((this.scale.height / 3) * 2 - p1MonImg.height)
    const p2MonImg = this.add.image(0, 0, MON_ASSET_KEYS[P2_MON]).setOrigin(0).setFlipX(true)
    p2MonImg.setX(this.scale.width - p2MonImg.width - PADDING)

    const DETAILS_WIDTH = this.scale.width / 2
    // P1
    const p1MonName = this.add.bitmapText(PADDING, 0, 'gb-font', MON_ASSET_KEYS[P1_MON], 40)
    let p1MonLvlStatus = this.#createLevelStatus(DETAILS_WIDTH / 2, p1MonName.y + p1MonName.height, 14)
    let p1MonHp = this.#createHealthBar(16, p1MonLvlStatus.y + BITMAP_NEGATIVE_Y_PADDING)

    this.add.container(DETAILS_WIDTH, p2MonImg.height, [
      this.add.image(0, 0, BATTLE_ASSET_KEYS.P1_BATTLE_DETAILS_BACKGROUND).setOrigin(0),
      p1MonName,
      p1MonLvlStatus,
      p1MonHp
    ])

    // P2
    const p2MonName = this.add.bitmapText(0, 0, 'gb-font', MON_ASSET_KEYS[P2_MON], 40)
    let p2MonLvlStatus = this.#createLevelStatus(DETAILS_WIDTH / 4, p1MonName.y + p1MonName.height, 100)
    let p2MonHp = this.#createHealthBar(16, p2MonLvlStatus.y + BITMAP_NEGATIVE_Y_PADDING, false)
  
    this.add.container(PADDING, 0, [
      this.add.image(0, 0, BATTLE_ASSET_KEYS.P2_BATTLE_DETAILS_BACKGROUND).setOrigin(0),
      p2MonName,
      p2MonLvlStatus,
      p2MonHp
    ])

    this.#battleMenu = new BattleMenu(this)
    this.#battleMenu.showMainBattleMenu()

    this.#cursorKeys = this.input.keyboard.createCursorKeys()
  }

  update () {
    const wasSpaceKeyPresed = Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
    if (wasSpaceKeyPresed) {
      this.#battleMenu.handlePlayerInput('OK')
      return
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
  /**
   * 
   * @param {Number} x the x position to place the level & status container
   * @param {Number} y the x position to place the level & status container
   * @param {Number} lvl the level of the mon
   * @param {String|Object} status the status of the mon, optional
   * @returns {Phaser.GameObjects.Container}
   */
  #createLevelStatus (x, y, lvl, status = null) {
    return this.add.container(x, y, [
      status ? this.add.bitmapText(0, BITMAP_NEGATIVE_Y_PADDING, 'gb-font', status, 30) : this.add.bitmapText(0, BITMAP_NEGATIVE_Y_PADDING, 'gb-font-thick', `Lv${lvl}`, 30)
    ])
  }

  /**
   * 
   * @param {Number} x the x position to place the health bar container 
   * @param {Number} y the y position to place the health bar container
   * @param {Boolean} showHp toggle vis of remaining/total HP
   * @returns {Phaser.GameObjects.Container}
   */
  #createHealthBar (x, y, showHp = true) {
    const hp = this.add.bitmapText(x, y + BITMAP_NEGATIVE_Y_PADDING * 1.4, 'gb-font-thick', `HP:`, 20)

    const leftCap  = this.add.image(hp.x + hp.width, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP).setOrigin(0, 0.5).setScale(1.35)
    const middle = this.add.image(leftCap.x + leftCap.width, y, HEALTH_BAR_ASSET_KEYS.MIDDLE).setOrigin(0, 0.5).setScale(1.35)
    middle.displayWidth = 190
    const rightCap = this.add.image(middle.x + middle.displayWidth, y, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP).setOrigin(0, 0.5).setScale(1.35)

    const items = [hp, leftCap, middle, rightCap]
    if (showHp) {
      // TODO dynamic HP
      const currHp = this.add.bitmapText(leftCap.x, hp.height + hp.y, 'gb-font-thick', `19 / 19`, 30)
      items.push(currHp)
    }
    return this.add.container(x, y, items)
  }
}