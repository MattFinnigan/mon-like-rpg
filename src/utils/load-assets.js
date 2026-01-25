import { ATTACK_ASSET_KEYS, BATTLE_ASSET_KEYS, BGM_ASSET_KEYS, MON_ASSET_KEYS, MON_BACK_ASSET_KEYS, MON_BALLS, MON_GRAY_ASSET_KEYS, SFX_ASSET_KEYS, TRAINER_GRAY_SPRITES, TRAINER_SPRITES } from "../assets/asset-keys.js"
import { ATTACK_ANIMS_PATH, ATTACK_SFX_ASSETS_PATH, BACKGROUND_ASSETS_PATH, BATTLE_ASSETS_PATH, BGM_ASSETS_PATH, MON_BACK_SPRITES_ASSETS_PATH, MON_BALL_ANIMS_ASSETS_PATH, MON_CRIES_ASSETS_PATH, MON_GRAY_SPRITES_ASSETS_PATH, MON_SPRITES_ASSETS_PATH, SFX_ASSETS_PATH, TRAINER_GRAY_ASSETS_PATH, TRAINER_SPRITES_ASSETS_PATH } from "./consts.js"
import { DataUtils } from "./data-utils.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").BaseMon} baseMon 
 */
export function loadBaseMonAssets (scene, baseMon) {
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
 * @param {import("../types/typedef").Mon} mon 
 */
export function loadMonAssets (scene, mon) {
  const baseMon = DataUtils.getBaseMonDetails(scene, mon.baseMonIndex)
  loadBaseMonAssets(scene, baseMon)
  // attks
  mon.attackIds.forEach(attkId => {
    const attk = DataUtils.getMonAttack(scene, attkId)
    // sfx
    scene.load.audio(attk.animationName, `${ATTACK_SFX_ASSETS_PATH}/${attk.animationName}.wav`)

    attk.assetKeys.forEach(assetKey => {
      // sprite
      scene.load.spritesheet(assetKey, `${ATTACK_ANIMS_PATH}/${assetKey}.png`, {
        frameWidth: attk.frameWidth,
        frameHeight: attk.frameHeight
      })
      scene.load.start()
      scene.load.once('complete', () => {
        // anim
        if (!scene.anims.get(assetKey)) {
          const animation = DataUtils.getAttackAnimation(scene, assetKey)
          if (!animation) {
            return
          }

          const frames = animation.frames
            ? scene.anims.generateFrameNumbers(animation.assetKey, { frames: animation.frames })
            : scene.anims.generateFrameNumbers(animation.assetKey)

          const anim = {
            key: animation.key,
            frames: frames,
            frameRate: animation.frameRate,
            repeat: animation.repeat,
            delay: animation.delay,
            yoyo: animation.yoyo
          }

          scene.anims.create(anim)

        }
      })
    })
  })
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
  scene.load.audio(SFX_ASSET_KEYS.BALL_WIGGLE, `${SFX_ASSETS_PATH}/BALL_WIGGLE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.BALL_TOSS, `${SFX_ASSETS_PATH}/BALL_TOSS.wav`)
  scene.load.audio(SFX_ASSET_KEYS.BALL_POOF, `${SFX_ASSETS_PATH}/BALL_POOF.wav`)
  scene.load.audio(BGM_ASSET_KEYS.EVOLUTION, `${BGM_ASSETS_PATH}/EVOLUTION.mp3`)
  scene.load.audio(BGM_ASSET_KEYS.MON_CAUGHT, `${BGM_ASSETS_PATH}/MON_CAUGHT.mp3`)

  scene.load.image(BATTLE_ASSET_KEYS.BATTLE_MENU_OPTIONS_BACKGROUND, `${BACKGROUND_ASSETS_PATH}/battle-menu-options.png`)
  scene.load.image(BATTLE_ASSET_KEYS.PLAYER_BATTLE_DETAILS_BACKGROUND, `/${BACKGROUND_ASSETS_PATH}/player-battle-details.png`)
  scene.load.image(BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND, `${BACKGROUND_ASSETS_PATH}/enemy-battle-details.png`)

  scene.load.audio(SFX_ASSET_KEYS.TAKE_DAMAGE, `${SFX_ASSETS_PATH}/TAKE_DAMAGE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.SUPER_EFFECTIVE, `${SFX_ASSETS_PATH}/SUPER_EFFECTIVE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.NOT_VERY_EFFECTIVE, `${SFX_ASSETS_PATH}/NOT_VERY_EFFECTIVE.wav`)
  scene.load.audio(SFX_ASSET_KEYS.FAINT_THUD, `${SFX_ASSETS_PATH}/FAINT_THUD.wav`)
  scene.load.audio(SFX_ASSET_KEYS.RUN, `${SFX_ASSETS_PATH}/RUN.wav`)
}