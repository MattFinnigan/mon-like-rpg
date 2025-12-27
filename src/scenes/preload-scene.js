import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, SYSTEM_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { SCENE_KEYS } from './scene-keys.js'

export class PreloadScene extends Phaser.Scene {
  constructor () {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE
    })
  }

  preload () {
    const backgroundAssetPath = 'assets/images/backgrounds'
    const monsAssetPath = 'assets/images/mons'
    const monsBackAssetPath = 'assets/images/mons/backs'
    const battleAssetPath = 'assets/images/battle'
    const uiAssestPath = 'assets/images/ui'

    this.load.bitmapFont(
      'gb-font',
      '/assets/fonts/minogram_6x10.png',
      '/assets/fonts/minogram_6x10.xml'
    )

    this.load.bitmapFont(
      'gb-font-small',
      '/assets/fonts/round_6x6.png',
      '/assets/fonts/round_6x6.xml'
    )

    this.load.bitmapFont(
      'gb-font-thick',
      '/assets/fonts/thick_8x8.png',
      '/assets/fonts/thick_8x8.xml'
    )

    this.load.image(SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND, `/${backgroundAssetPath}/dialog.png`)
    this.load.image(UI_ASSET_KEYS.CURSOR, `${uiAssestPath}/cursor.png`)

    this.load.image(BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND, `/${backgroundAssetPath}/battle-menu-options.png`)
    this.load.image(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/player-battle-details.png`)
    this.load.image(BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/enemy-battle-details.png`)

    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${battleAssetPath}/hp_left_cap.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${battleAssetPath}/hp_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${battleAssetPath}/hp_right_cap.png`)

    const keys = Object.keys(MON_ASSET_KEYS)

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'PIKACHU' || keys[i] === 'BLASTOISE') {
        this.load.image(keys[i], `/${monsAssetPath}/${i + 1}.PNG`)
        this.load.image(MON_BACK_ASSET_KEYS[keys[i] + '_BACK'], `/${monsBackAssetPath}/${i + 1}.PNG`)
      }

    }

    console.log(`[${PreloadScene.name}:preload] invoked`)
  }

  create () {
    console.log(`[${PreloadScene.name}:create] invoked`)
    this.scene.start(SCENE_KEYS.BATTLE_SCENE)
  }
}