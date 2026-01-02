import { MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, MON_GRAY_ASSET_KEYS } from "../assets/asset-keys.js"

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
}