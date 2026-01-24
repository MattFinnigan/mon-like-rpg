import { BATTLE_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, MON_BALLS, MON_GRAY_ASSET_KEYS, SFX_ASSET_KEYS, TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../assets/asset-keys.js"
import { BACKGROUND_ASSETS_PATH, BATTLE_ASSETS_PATH, MON_BACK_SPRITES_ASSETS_PATH, MON_BALL_ANIMS_ASSETS_PATH, MON_CRIES_ASSETS_PATH, MON_GRAY_SPRITES_ASSETS_PATH, MON_SPRITES_ASSETS_PATH, SFX_ASSETS_PATH, TRAINER_GRAY_ASSETS_PATH, TRAINER_SPRITES_ASSETS_PATH } from "./consts.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").BaseMon} baseMon 
 */
export function loadMonAssets (scene, baseMon) {
  const monNum = baseMon.baseMonIndex + 1
  const key = MON_ASSET_KEYS[baseMon.assetKey]

  scene.load.image(key, `${MON_SPRITES_ASSETS_PATH}/${monNum}.png`)
  scene.load.image(MON_BACK_ASSET_KEYS[key + '_BACK'], `${MON_BACK_SPRITES_ASSETS_PATH}/${monNum}.png`)
  scene.load.image(MON_GRAY_ASSET_KEYS[key + '_GRAY'], `${MON_GRAY_SPRITES_ASSETS_PATH}/${monNum}.png`)
  scene.load.audio(key, [`${MON_CRIES_ASSETS_PATH}/${monNum}.ogg`])
}

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {string} assetKey 
 */
export function loadTrainerSprites (scene, assetKey) {
  scene.load.image(TRAINER_SPRITES[assetKey], `${TRAINER_SPRITES_ASSETS_PATH}/RBY Y${assetKey.toLowerCase()}.png`)
  scene.load.image(TRAINER_GRAY_SPRITES[assetKey + '_GRAY'], `${TRAINER_GRAY_ASSETS_PATH}/RBY ${assetKey.toLowerCase()} BW.png`)
}

export function loadBattleAssets (scene) {
  scene.load.image(BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND, `${BACKGROUND_ASSETS_PATH}/battle-menu-options.png`)
  scene.load.image(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND, `/${BACKGROUND_ASSETS_PATH}/player-battle-details.png`)
  scene.load.image(BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND, `${BACKGROUND_ASSETS_PATH}/enemy-battle-details.png`)

  scene.load.spritesheet(MON_BALLS.MON_BALLS_SHEET_1, `${BATTLE_ASSETS_PATH}/balls.png`, {
    frameWidth: 48,
    frameHeight: 48
  })

  scene.load.image(MON_BALLS.MON_BALL_EXPAND_1, `/${MON_BALL_ANIMS_ASSETS_PATH}/expand_1.png`)
  scene.load.image(MON_BALLS.MON_BALL_EXPAND_2, `/${MON_BALL_ANIMS_ASSETS_PATH}/expand_2.png`)
  scene.load.image(MON_BALLS.MON_BALL_EXPAND_3, `/${MON_BALL_ANIMS_ASSETS_PATH}/expand_3.png`)

  scene.load.image(MON_BALLS.MON_BALL_WIGGLE_1, `/${MON_BALL_ANIMS_ASSETS_PATH}/wiggle_1.png`)
  scene.load.image(MON_BALLS.MON_BALL_WIGGLE_2, `/${MON_BALL_ANIMS_ASSETS_PATH}/wiggle_2.png`)
  scene.load.image(MON_BALLS.MON_BALL_WIGGLE_3, `/${MON_BALL_ANIMS_ASSETS_PATH}/wiggle_3.png`)
  
  scene.load.audio(SFX_ASSET_KEYS.BALL_POOF, `${SFX_ASSETS_PATH}/BALL_POOF.wav`)
  scene.load.audio(SFX_ASSET_KEYS.BALL_TOSS, `${SFX_ASSETS_PATH}/BALL_TOSS.wav`)
  scene.load.audio(SFX_ASSET_KEYS.BALL_WIGGLE, `${SFX_ASSETS_PATH}/BALL_WIGGLE.wav`)

  scene.load.audio(SFX_ASSET_KEYS.TAKE_DAMAGE, `${SFX_ASSETS_PATH}/TAKE_DAMAGE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.SUPER_EFFECTIVE, `${SFX_ASSETS_PATH}/SUPER_EFFECTIVE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.NOT_VERY_EFFECTIVE, `${SFX_ASSETS_PATH}/NOT_VERY_EFFECTIVE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.FAINT_THUD, `${SFX_ASSETS_PATH}/FAINT_THUD.wav`)
  scene.load.audio(SFX_ASSET_KEYS.RUN, `${SFX_ASSETS_PATH}/RUN.wav`)
}