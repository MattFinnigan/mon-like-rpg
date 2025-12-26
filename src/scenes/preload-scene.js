import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, SYSTEM_ASSET_KEYS } from '../assets/asset-keys.js'
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
    const kenneysAssetPath = 'assets/images/kenneys-assets'
    const monsAssetPath = 'assets/images/mons'
    const monsBackAssetPath = 'assets/images/mons/backs'

    this.load.bitmapFont(
      'gb-font',
      '/assets/fonts/minogram_6x10.png',
      '/assets/fonts/minogram_6x10.xml'
    )

    this.load.image(SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND, `/${backgroundAssetPath}/dialog.png`)

    this.load.image(BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND, `/${kenneysAssetPath}/ui-space-expansion/custom-ui.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_left.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_right.png`)

    const keys = Object.keys(MON_ASSET_KEYS)

    for (let i = 0; i < keys.length; i++) {
      this.load.image(keys[i], `/${monsAssetPath}/${i + 1}.PNG`)
      this.load.image(MON_BACK_ASSET_KEYS[keys[i] + '_BACK'], `/${monsBackAssetPath}/${i + 1}.PNG`)
    }

    console.log(`[${PreloadScene.name}:preload] invoked`)
  }

  create () {
    console.log(`[${PreloadScene.name}:create] invoked`)
    this.scene.start(SCENE_KEYS.BATTLE_SCENE)
  }
}