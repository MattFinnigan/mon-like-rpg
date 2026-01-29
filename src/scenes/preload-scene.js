import { DATA_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_BALLS, SFX_ASSET_KEYS, STATUS_EFFECT_ASSET_KEYS, TEXTURE_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js'
import { BATTLE_ASSETS_PATH, DATA_ASSETS_PATH, MAP_ASSETS_PATH, MON_BALL_ANIMS_ASSETS_PATH, SFX_ASSETS_PATH, STATUS_EFFECT_ASSETS_PATH, STATUS_EFFECT_SFX_ASSETS_PATH } from '../utils/consts.js'
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
    this.load.json(DATA_ASSET_KEYS.ATTACKS, `${DATA_ASSETS_PATH}/attacks.json`)
    this.load.json(DATA_ASSET_KEYS.ATTACK_ANIMATIONS, `${DATA_ASSETS_PATH}/attack_animations.json`)
    this.load.json(DATA_ASSET_KEYS.ANIMATIONS, `${DATA_ASSETS_PATH}/animations.json`)
    this.load.json(DATA_ASSET_KEYS.BASE_MONS, `${DATA_ASSETS_PATH}/base-mons.json`)
    this.load.json(DATA_ASSET_KEYS.MONS, `${DATA_ASSETS_PATH}/mons.json`)
    this.load.json(DATA_ASSET_KEYS.ENCOUNTER_AREAS, `${DATA_ASSETS_PATH}/encounter_areas.json`)
    this.load.json(DATA_ASSET_KEYS.TRAINERS, `${DATA_ASSETS_PATH}/trainers.json`)
    this.load.json(DATA_ASSET_KEYS.ITEMS, `${DATA_ASSETS_PATH}/items.json`)
    this.load.json(DATA_ASSET_KEYS.LEVEL_UP_MOVES, `${DATA_ASSETS_PATH}/level-up-moves.json`)
    
    
    // common
    this.load.atlas(TEXTURE_ASSET_KEYS.SYSTEM, 'assets/images/system.png', `${DATA_ASSETS_PATH}/system.json`);
    this.load.spritesheet(MON_BALLS.MON_BALLS_SHEET_1, `${BATTLE_ASSETS_PATH}/balls.png`, {
      frameWidth: 48,
      frameHeight: 48
    })
    this.load.spritesheet(MON_BALLS.BALL_POOF, `${MON_BALL_ANIMS_ASSETS_PATH}/BALL_POOF.png`, {
      frameWidth: 137,
      frameHeight: 133
    })

    this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${MAP_ASSETS_PATH}/aus.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${MAP_ASSETS_PATH}/aus-foreground.png`)
    this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, `${DATA_ASSETS_PATH}/auslevel.json`)

    this.load.image(WORLD_ASSET_KEYS.WORLD_COLLISION, `/${MAP_ASSETS_PATH}/collision.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE, `/${MAP_ASSETS_PATH}/encounter.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_PORTAL_ZONE, `/${MAP_ASSETS_PATH}/portal.png`)
  
    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${BATTLE_ASSETS_PATH}/hp_left_cap.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${BATTLE_ASSETS_PATH}/hp_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${BATTLE_ASSETS_PATH}/hp_right_cap.png`)
    
    // character, npcs world sprites
    this.load.spritesheet(TEXTURE_ASSET_KEYS.CHARACTERS, `assets/images/characters.png`, {
      frameWidth: 72,
      frameHeight: 96
    })

    this.load.spritesheet(STATUS_EFFECT_ASSET_KEYS.BURNT, `${STATUS_EFFECT_ASSETS_PATH}/BURNT.png`, {
      frameWidth: 74,
      frameHeight: 54
    })
    this.load.spritesheet(STATUS_EFFECT_ASSET_KEYS.PARALYZED, `${STATUS_EFFECT_ASSETS_PATH}/PARALYZED.png`, {
      frameWidth: 39,
      frameHeight: 112
    })
    this.load.image(STATUS_EFFECT_ASSET_KEYS.CONFUSED, `${STATUS_EFFECT_ASSETS_PATH}/CONFUSED.png`)
    this.load.spritesheet(STATUS_EFFECT_ASSET_KEYS.FROZEN, `${STATUS_EFFECT_ASSETS_PATH}/FROZEN.png`, {
      frameWidth: 174,
      frameHeight: 100
    })

    // sfx
    this.load.audio(SFX_ASSET_KEYS.MENU, `${SFX_ASSETS_PATH}/MENU.wav`)
    this.load.audio(SFX_ASSET_KEYS.MENU_MOVE, `${SFX_ASSETS_PATH}/MENU_MOVE.wav`)
    this.load.audio(SFX_ASSET_KEYS.PRESS_AB, `${SFX_ASSETS_PATH}/PRESS_AB.wav`)
    this.load.audio(SFX_ASSET_KEYS.POTION_USED, `${SFX_ASSETS_PATH}/POTION_USED.wav`)
    this.load.audio(SFX_ASSET_KEYS.SAVE, `${SFX_ASSETS_PATH}/SAVE.wav`)
    this.load.audio(SFX_ASSET_KEYS.SWAP, `${SFX_ASSETS_PATH}/SWAP.wav`)
    this.load.audio(SFX_ASSET_KEYS.COLLISION, `${SFX_ASSETS_PATH}/COLLISION.wav`)
    this.load.audio(SFX_ASSET_KEYS.DENIED, `${SFX_ASSETS_PATH}/DENIED.wav`)
    this.load.audio(SFX_ASSET_KEYS.EXP_GAIN, `${SFX_ASSETS_PATH}/EXP_GAIN.wav`)
    this.load.audio(SFX_ASSET_KEYS.RUN, `${SFX_ASSETS_PATH}/RUN.wav`)
    this.load.audio(SFX_ASSET_KEYS.ITEM_OBTAINED, `${SFX_ASSETS_PATH}/ITEM_OBTAINED.wav`)
    this.load.audio(SFX_ASSET_KEYS.LEVEL_UP, `${SFX_ASSETS_PATH}/LEVEL_UP.mp3`)
  
    this.load.audio(STATUS_EFFECT_ASSET_KEYS.BURNT, `${STATUS_EFFECT_SFX_ASSETS_PATH}/BURNT.wav`)
    this.load.audio(STATUS_EFFECT_ASSET_KEYS.CONFUSED, `${STATUS_EFFECT_SFX_ASSETS_PATH}/CONFUSED.wav`)
    this.load.audio(STATUS_EFFECT_ASSET_KEYS.PARALYZED, `${STATUS_EFFECT_SFX_ASSETS_PATH}/PARALYZED.wav`)
    this.load.audio(STATUS_EFFECT_ASSET_KEYS.FROZEN, `${STATUS_EFFECT_SFX_ASSETS_PATH}/FROZEN.wav`)

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

      const anim = {
        key: animation.key,
        frames: frames,
        frameRate: animation.frameRate,
        repeat: animation.repeat,
        delay: animation.delay,
        yoyo: animation.yoyo,
        msPerFrame: animation.msPerFrame
      }

      this.anims.create(anim)
    })

  }
}