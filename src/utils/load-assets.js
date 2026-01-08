import { BATTLE_ASSET_KEYS, HEALTH_BAR_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, MON_BALLS, MON_GRAY_ASSET_KEYS, TRAINER_GRAY_SPRITES, TRAINER_SPRITES, TYPE_ASSET_KEYS } from "../assets/asset-keys.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").BaseMon} baseMon 
 */
export function loadMonAssets (scene, baseMon) {
  const monNum = baseMon.baseMonIndex + 1
  const key = MON_ASSET_KEYS[baseMon.assetKey]

  scene.load.image(key, `/assets/images/mons/${monNum}.png`)
  scene.load.image(MON_BACK_ASSET_KEYS[key + '_BACK'], `/assets/images/mons/backs/${monNum}.png`)
  scene.load.image(MON_GRAY_ASSET_KEYS[key + '_GRAY'], `/assets/images/mons/gray/${monNum}.png`)
  scene.load.audio(key, [`assets/audio/mons/cries/${monNum}.ogg`])
  scene.load.image(TYPE_ASSET_KEYS.NORMAL, `/assets/images/types/NORMAL.png`)
  // baseMon.types.forEach(t => {
  //   scene.load.image(TYPE_ASSET_KEYS[t.name], `/assets/images/types/${t.name}.png`)
  // })
}

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {string} assetKey 
 */
export function loadTrainerSprites (scene, assetKey) {
  scene.load.image(TRAINER_SPRITES[assetKey], `/assets/images/trainers/RBY Y${assetKey.toLowerCase()}.png`)
  scene.load.image(TRAINER_GRAY_SPRITES[assetKey + '_GRAY'], `/assets/images/trainers/gray/RBY ${assetKey.toLowerCase()} BW.png`)
}

export function loadBattleAssets (scene) {
  const backgroundAssetPath = 'assets/images/backgrounds'
  const battleAssetPath = 'assets/images/battle'
  scene.load.image(BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND, `/${backgroundAssetPath}/battle-menu-options.png`)
  scene.load.image(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/player-battle-details.png`)
  scene.load.image(BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND, `/${backgroundAssetPath}/enemy-battle-details.png`)

  // hp
  scene.load.image(HEALTH_BAR_ASSET_KEYS.LEFT_CAP, `/${battleAssetPath}/hp_left_cap.png`)
  scene.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `/${battleAssetPath}/hp_mid.png`)
  scene.load.image(HEALTH_BAR_ASSET_KEYS.RIGHT_CAP, `/${battleAssetPath}/hp_right_cap.png`)

  scene.load.spritesheet(MON_BALLS.MON_BALLS_SHEET_1, `/${battleAssetPath}/balls.png`, {
    frameWidth: 48,
    frameHeight: 48
  })
}