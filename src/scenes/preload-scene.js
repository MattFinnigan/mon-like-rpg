import { ATTACK_ASSET_KEYS, BATTLE_ASSET_KEYS, BGM_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, SYSTEM_ASSET_KEYS, TRAINER_GRAY_SPRITES, TRAINER_SPRITES, UI_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js'
import { dataManager } from '../utils/data-manager.js'
import { DataUtils } from '../utils/data-utils.js'
import { SCENE_KEYS } from './scene-keys.js'

export class PreloadScene extends Phaser.Scene {
  constructor () {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE
    })
  }

  init () {
    console.log(`[${PreloadScene.name}:init] invoked`)
  }

  preload () {
    console.log(`[${PreloadScene.name}:preload] invoked`)

    const { width, height } = this.scale
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.load.on('complete', () => {
      dataManager.loadData()
      this.scene.start(SCENE_KEYS.WORLD_SCENE)
      this.#createAnimations()
    })


    const backgroundAssetPath = 'assets/images/backgrounds'
    
    const uiAssestPath = 'assets/images/ui'
    const charAssetPath = 'assets/images/character'
    const mapAssetPath = 'assets/images/map'
    const bgmAssetPath = 'assets/audio/bgm'
    const npcAssetPath = 'assets/images/npc'

    const attackAnimPath = 'assets/images/anims/pimen'

    // fonts
    this.load.bitmapFont(
      'gb-font',
      '/assets/fonts/minogram_6x10.png',
      '/assets/fonts/minogram_6x10.xml'
    )

    this.load.bitmapFont(
      'gb-font-light',
      '/assets/fonts/minogram_6x10_light.png',
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
    this.load.json(DATA_ASSET_KEYS.BASE_MONS, 'assets/data/base-mons.json')
    this.load.json(DATA_ASSET_KEYS.MONS, 'assets/data/mons.json')
    this.load.json(DATA_ASSET_KEYS.ENCOUNTER_AREAS, 'assets/data/encounter_areas.json')
    this.load.json(DATA_ASSET_KEYS.TRAINERS, 'assets/data/trainers.json')
    // TODO move this to localstorage or api fetch
    this.load.json(DATA_ASSET_KEYS.PLAYER, 'assets/data/player.json')

    // common
    this.load.image(SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND, `/${backgroundAssetPath}/dialog.png`)
    this.load.image(UI_ASSET_KEYS.CURSOR, `${uiAssestPath}/cursor.png`)
    this.load.image(UI_ASSET_KEYS.ARROW, `${uiAssestPath}/arrow.png`)
  
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

    this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${mapAssetPath}/background.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${mapAssetPath}/foreground.png`)
    this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, 'assets/data/level.json')

    this.load.image(WORLD_ASSET_KEYS.WORLD_COLLISION, `/${mapAssetPath}/collision.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE, `/${mapAssetPath}/encounter.png`)
  
    // character, npcs world sprites
    this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `${charAssetPath}/character.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_1, `${npcAssetPath}/npc1.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_2, `${npcAssetPath}/npc2.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_3, `${npcAssetPath}/npc3.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_4, `${npcAssetPath}/npc4.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_5, `${npcAssetPath}/npc5.png`, {
      frameWidth: 72,
      frameHeight: 96
    })

    this.registry.set('audio', new AudioManager(this))
  }

  create () {
    console.log(`[${PreloadScene.name}:create] invoked`)
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