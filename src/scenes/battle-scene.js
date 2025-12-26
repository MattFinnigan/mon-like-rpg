import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, SYSTEM_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'
import { PADDING, BITMAP_NEGATIVE_Y_PADDING } from '../lib/consts.js'

export class BattleScene extends Phaser.Scene {
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
    const P2_MON = 'EEVEE'

    const { width, height } = this.scale.gameSize

    const DIALOG_CONTAINER = this.add.container(0, (height / 3) * 2, [
      this.add.image(0, 0, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
    ])

    const P1_MON_IMG = this.add.image(PADDING, 0, MON_BACK_ASSET_KEYS[P1_MON + '_BACK']).setOrigin(0)
    P1_MON_IMG.setY(DIALOG_CONTAINER.y - P1_MON_IMG.height)
    const P2_MON_IMG = this.add.image(0, 0, MON_ASSET_KEYS[P2_MON]).setOrigin(0).setFlipX(true)
    P2_MON_IMG.setX(width - P2_MON_IMG.width - PADDING)

    const DETAILS_WIDTH = width / 2
    // P1
    const P1_MON_NAME = this.add.bitmapText(PADDING, 0, 'gb-font', MON_ASSET_KEYS[P1_MON], 40)
    let p1MonLvlStatus = this.#createLevelStatus(DETAILS_WIDTH / 2, P1_MON_NAME.y + P1_MON_NAME.height, 14)
    let p1MonHp = this.#createHealth(16, p1MonLvlStatus.y + BITMAP_NEGATIVE_Y_PADDING)

    this.add.container(DETAILS_WIDTH, P2_MON_IMG.height, [
      this.add.image(0, 0, BATTLE_ASSET_KEYS.P1_BATTLE_DETAILS_BACKGROUND).setOrigin(0),
      P1_MON_NAME,
      p1MonLvlStatus,
      p1MonHp
    ])

    // P2
    const P2_MON_NAME = this.add.bitmapText(0, 0, 'gb-font', MON_ASSET_KEYS[P2_MON], 40)
    let p2MonLvlStatus = this.#createLevelStatus(DETAILS_WIDTH / 4, P1_MON_NAME.y + P1_MON_NAME.height, 100)
    let p2MonHp = this.#createHealth(16, p2MonLvlStatus.y + BITMAP_NEGATIVE_Y_PADDING, false)
  
    this.add.container(PADDING, 0, [
      this.add.image(0, 0, BATTLE_ASSET_KEYS.P2_BATTLE_DETAILS_BACKGROUND).setOrigin(0),
      P2_MON_NAME,
      p2MonLvlStatus,
      p2MonHp
    ])


  }

  #createLevelStatus (x, y, lvl, status = null) {
    return this.add.container(x, y, [
      status ? this.add.bitmapText(0, BITMAP_NEGATIVE_Y_PADDING, 'gb-font', status, 30) : this.add.bitmapText(0, BITMAP_NEGATIVE_Y_PADDING, 'gb-font-thick', `Lv${lvl}`, 30)
    ])
  }

  #createHealth (x, y, showHp = true) {
    const HP = this.add.bitmapText(x, y + BITMAP_NEGATIVE_Y_PADDING * 1.4, 'gb-font-thick', `HP:`, 20)

    const LEFT_CAP  = this.add.image(HP.x + HP.width, y, HEALTH_BAR_ASSET_KEYS.LEFT_CAP).setOrigin(0, 0.5).setScale(1.35)
    const MIDDLE = this.add.image(LEFT_CAP.x + LEFT_CAP.width, y, HEALTH_BAR_ASSET_KEYS.MIDDLE).setOrigin(0, 0.5).setScale(1.35)
    MIDDLE.displayWidth = 190
    const RIGHT_CAP = this.add.image(MIDDLE.x + MIDDLE.displayWidth, y, HEALTH_BAR_ASSET_KEYS.RIGHT_CAP).setOrigin(0, 0.5).setScale(1.35)

    const ITEMS = [HP, LEFT_CAP, MIDDLE, RIGHT_CAP]
    if (showHp) {
      // TODO dynamic HP
      const CURR_HP = this.add.bitmapText(LEFT_CAP.x, HP.height + HP.y, 'gb-font-thick', `19 / 19`, 30)
      ITEMS.push(CURR_HP)
    }
    return this.add.container(x, y, ITEMS)
  }
}