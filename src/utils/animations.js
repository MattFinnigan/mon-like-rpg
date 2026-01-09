import { MON_BALLS } from "../assets/asset-keys.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").Coordinate} position
 * @returns {Phaser.GameObjects.Sprite}
 */
export function createExpandBallAnimation (scene, position) {
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

  return scene.add.sprite(position.x, position.y, MON_BALLS.MON_BALL_EXPAND_1)
}