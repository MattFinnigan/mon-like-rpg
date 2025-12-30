import { ATTACK_ASSET_KEYS, BATTLE_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, SYSTEM_ASSET_KEYS, UI_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { DataUtils } from '../utils/data-utils.js'
import { SCENE_KEYS } from './scene-keys.js'

export class PreloadScene extends Phaser.Scene {
  constructor () {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE
    })
  }

  preload () {
    console.log(`[${PreloadScene.name}:preload] invoked`)
    const backgroundAssetPath = 'assets/images/backgrounds'
    const monsAssetPath = 'assets/images/mons'
    const monsBackAssetPath = 'assets/images/mons/backs'
    const battleAssetPath = 'assets/images/battle'
    const uiAssestPath = 'assets/images/ui'
    const charAssetPath = 'assets/images/character'
    const mapAssetPath = 'assets/images/map'

    const attackAnimPath = 'assets/images/anims/pimen'
    const axulAssetPath = 'assets/images/character/axulart'
    const pbGamesAssetPath = 'assets/images/npc/parabellum-games'

    // fonts
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

    // json
    this.load.json(DATA_ASSET_KEYS.ATTACKS, 'assets/data/attacks.json')
    this.load.json(DATA_ASSET_KEYS.ANIMATIONS, 'assets/data/animations.json')
  
    // common
    this.load.image(SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND, `/${backgroundAssetPath}/dialog.png`)
    this.load.image(UI_ASSET_KEYS.CURSOR, `${uiAssestPath}/cursor.png`)

    // battle
    this.load.image(BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND, `/${backgroundAssetPath}/battle-menu-options.png`)
    this.load.image(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/player-battle-details.png`)
    this.load.image(BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/enemy-battle-details.png`)

    // hp
    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${battleAssetPath}/hp_left_cap.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${battleAssetPath}/hp_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${battleAssetPath}/hp_right_cap.png`)

    // mon sprites
    const keys = Object.keys(MON_ASSET_KEYS)
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'PIKACHU' || keys[i] === 'BLASTOISE') {
        this.load.image(keys[i], `/${monsAssetPath}/${i + 1}.PNG`)
        this.load.image(MON_BACK_ASSET_KEYS[keys[i] + '_BACK'], `/${monsBackAssetPath}/${i + 1}.PNG`)
      }

    }
    // attack
    this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD, `${attackAnimPath}/ice-attack/active.png`, {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD_START, `${attackAnimPath}/ice-attack/start.png`, {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet(ATTACK_ASSET_KEYS.SLASH, `${attackAnimPath}/slash.png`, {
      frameWidth: 48,
      frameHeight: 48
    })

    // levels
    // this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${mapAssetPath}/level_background.png`)
    // this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${mapAssetPath}/level_foreground.png`)
    // this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, 'assets/data/level.json')

    // this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${mapAssetPath}/demo_background.png`)
    // this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${mapAssetPath}/demo_foreground.png`)
    // this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, 'assets/data/demo_level.json')

    this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${mapAssetPath}/background.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${mapAssetPath}/foreground.png`)
    this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, 'assets/data/pt_level.json')

    this.load.image(WORLD_ASSET_KEYS.WORLD_COLLISION, `/${mapAssetPath}/collision.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE, `/${mapAssetPath}/encounter.png`)
  
    // character
    this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `${charAssetPath}/character.png`, {
      frameWidth: 64,
      frameHeight: 64
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC, `${pbGamesAssetPath}/npcs.png`, {
      frameWidth: 16,
      frameHeight: 16
    })
  
  }

  create () {
    console.log(`[${PreloadScene.name}:create] invoked`)

    this.scene.start(SCENE_KEYS.WORLD_SCENE)
    this.#createAnimations()
  }

  #createAnimations () {
    const animations = DataUtils.getAnimations(this)
    animations.forEach(animation => {
      const frames = animation.frames
        ? this.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
        : this.anims.generateFrameNumbers(animation.assetKey)

      this.anims.create({
        key: animation.key,
        frames: frames,
        frameRate: animation.frameRate,
        repeat: animation.repeat,
        delay: animation.delay,
        yoyo: animation.yoyo
      })
    })

  }
}