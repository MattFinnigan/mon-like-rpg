import { ATTACK_ASSET_KEYS, BATTLE_ASSET_KEYS, BGM_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_BALLS, PARTY_MON_SPRITES, SFX_ASSET_KEYS, SYSTEM_ASSET_KEYS, TRAINER_GRAY_SPRITES, TRAINER_SPRITES, UI_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js'
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js'
import { ATTACK_ANIMS_PATH, BACKGROUND_ASSETS_PATH, BATTLE_ASSETS_PATH, BGM_ASSETS_PATH, CHAR_ASSETS_PATH, DATA_ASSETS_PATH, MAP_ASSETS_PATH, MON_BALL_ANIMS_ASSETS_PATH, NPC_ASSETS_PATH, PARTY_MON_ASSETS_PATH, SFX_ASSETS_PATH, UI_ASSETS_PATH, UI_DIALOG_ASSETS_PATH } from '../utils/consts.js'
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
    this.load.image(SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND, `/${BACKGROUND_ASSETS_PATH}/dialog.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM, `/${UI_DIALOG_ASSETS_PATH}/border-bottom.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM_LEFT, `/${UI_DIALOG_ASSETS_PATH}/border-bottom-left.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM_RIGHT, `/${UI_DIALOG_ASSETS_PATH}/border-bottom-right.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_LEFT, `/${UI_DIALOG_ASSETS_PATH}/border-left.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_RIGHT, `/${UI_DIALOG_ASSETS_PATH}/border-right.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_TOP, `/${UI_DIALOG_ASSETS_PATH}/border-top.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_TOP_LEFT, `/${UI_DIALOG_ASSETS_PATH}/border-top-left.png`)
    this.load.image(UI_ASSET_KEYS.DIALOG_BORDER_TOP_RIGHT, `/${UI_DIALOG_ASSETS_PATH}/border-top-right.png`)
    this.load.spritesheet(MON_BALLS.MON_BALLS_SHEET_1, `${BATTLE_ASSETS_PATH}/balls.png`, {
      frameWidth: 48,
      frameHeight: 48
    })
    this.load.spritesheet(MON_BALLS.BALL_POOF, `${MON_BALL_ANIMS_ASSETS_PATH}/BALL_POOF.png`, {
      frameWidth: 137,
      frameHeight: 133
    })

    this.load.image(UI_ASSET_KEYS.CURSOR, `${UI_ASSETS_PATH}/cursor.png`)
    this.load.image(UI_ASSET_KEYS.ARROW, `${UI_ASSETS_PATH}/arrow.png`)
  
    // attack
    // this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD, `${ATTACK_ANIMS_PATH}/ice-attack/active.png`, {
    //   frameWidth: 32,
    //   frameHeight: 32
    // })
    // this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD_START, `${ATTACK_ANIMS_PATH}/ice-attack/start.png`, {
    //   frameWidth: 32,
    //   frameHeight: 32
    // })
    // this.load.spritesheet(ATTACK_ASSET_KEYS.FIRE_SPIN, `${ATTACK_ANIMS_PATH}/fire-spin.png`, {
    //   frameWidth: 137,
    //   frameHeight: 177
    // })
    // this.load.spritesheet(ATTACK_ASSET_KEYS.SLASH, `${ATTACK_ANIMS_PATH}/slash.png`, {
    //   frameWidth: 48,
    //   frameHeight: 48
    // })


    this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `/${MAP_ASSETS_PATH}/aus.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_FOREGROUND, `/${MAP_ASSETS_PATH}/aus-foreground.png`)
    this.load.tilemapTiledJSON(WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL, `${DATA_ASSETS_PATH}/auslevel.json`)

    this.load.image(WORLD_ASSET_KEYS.WORLD_COLLISION, `/${MAP_ASSETS_PATH}/collision.png`)
    this.load.image(WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE, `/${MAP_ASSETS_PATH}/encounter.png`)
  
    this.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${BATTLE_ASSETS_PATH}/hp_left_cap.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${BATTLE_ASSETS_PATH}/hp_mid.png`)
    this.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${BATTLE_ASSETS_PATH}/hp_right_cap.png`)
    
    // character, npcs world sprites
    this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `${CHAR_ASSETS_PATH}/character.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_1, `${NPC_ASSETS_PATH}/npc1.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_2, `${NPC_ASSETS_PATH}/npc2.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_3, `${NPC_ASSETS_PATH}/npc3.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_4, `${NPC_ASSETS_PATH}/npc4.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_5, `${NPC_ASSETS_PATH}/npc5.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC_SHEET_6, `${NPC_ASSETS_PATH}/npc6.png`, {
      frameWidth: 72,
      frameHeight: 96
    })
    this.load.spritesheet(PARTY_MON_SPRITES.PARTY_MON_SPRITES_SHEET_1, `${PARTY_MON_ASSETS_PATH}/sheet1.png`, {
      frameWidth: 72,
      frameHeight: 96
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
        yoyo: animation.yoyo
      }

      this.anims.create(anim)
    })

  }
}