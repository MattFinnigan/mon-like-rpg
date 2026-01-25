import { MON_BALLS } from "../assets/asset-keys.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").Coordinate} position
 * @returns {Phaser.GameObjects.Sprite}
 */
export function createExpandBallAnimation (scene, position) {
  const sprite = scene.add.sprite(position.x, position.y, MON_BALLS.MON_BALL_EXPAND_1)
  
  if (scene.anims.get(MON_BALLS.MON_BALL_EXPAND_ANIMATION)) {
    return sprite
  }

  scene.anims.create({
    key: MON_BALLS.MON_BALL_EXPAND_ANIMATION,
    frames: [
      {
        key: MON_BALLS.MON_BALL_EXPAND_1
      },
      {
        key: MON_BALLS.MON_BALL_EXPAND_2
      },
      {
        key: MON_BALLS.MON_BALL_EXPAND_3
      }
    ],
    frameRate: 10,
    repeat: 0
  })

  return sprite
}

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").Coordinate} position
 * @returns {Phaser.GameObjects.Sprite}
 */
export function createBallWiggleAnimation (scene, position) {
  const sprite = scene.add.sprite(position.x, position.y, MON_BALLS.MON_BALL_WIGGLE_2)
  
  if (scene.anims.get(MON_BALLS.MON_BALL_WIGGLE_ANIMATION)) {
    return sprite
  }

  scene.anims.create({
    key: MON_BALLS.MON_BALL_WIGGLE_ANIMATION,
    frames: [
      {
        key: MON_BALLS.MON_BALL_WIGGLE_1
      },
      {
        key: MON_BALLS.MON_BALL_WIGGLE_2
      },
      {
        key: MON_BALLS.MON_BALL_WIGGLE_3
      },
      {
        key: MON_BALLS.MON_BALL_WIGGLE_2
      }
    ],
    frameRate: 10,
    repeat: 0
  })

  return sprite
}