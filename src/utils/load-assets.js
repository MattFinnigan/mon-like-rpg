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
