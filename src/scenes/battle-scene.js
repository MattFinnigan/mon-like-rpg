import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, SYSTEM_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'

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

    const p1Mon = 'VENUSAUR'
    const p2Mon = 'DRAGONITE'

    const { width, height } = this.scale.gameSize
    const PADDING = 5

    const p1MonImg = this.add.image(PADDING, 0, MON_BACK_ASSET_KEYS[p1Mon + '_BACK']).setOrigin(0)
    p1MonImg.setY(height / 3 - PADDING)

    const p2MonImg = this.add.image(0, 0, MON_ASSET_KEYS[p2Mon]).setOrigin(0).setFlipX(true)
    p2MonImg.setX(width - p2MonImg.width - PADDING)

    // Player 1 mon's details
    this.add.container(width / 2, p2MonImg.height, [
      this.add.bitmapText(0, 0, 'gb-font', MON_ASSET_KEYS[p1Mon], 10)
    ])

    // Player 2 mon's details
    this.add.container(PADDING, 0, [
      this.add.bitmapText(0, 0, 'gb-font', MON_ASSET_KEYS[p2Mon], 10)
    ])

    this.add.container(0, (height / 3) * 2, [
      this.add.image(0, 0, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
    ])
  }
}