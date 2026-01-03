import { TILE_SIZE } from "../../config.js"
import { TRANSITION_TYPES } from "../common/transition-types.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {object} [options] 
 * @param {() => void} [options.callback] 
 * @param {Phaser.GameObjects.Sprite[]} [options.spritesToNotBeObscured=[]]
 * @param {boolean} [options.skipSceneTransition=false] 
 * @param {TRANSITION_TYPES} [options.type='CLOSE_IN_Y_FAST']
 */
export function createBattleSceneTransition (scene, options) {
  const skipSceneTransition = options?.skipSceneTransition || false
  if (skipSceneTransition) {
    if (options?.callback) {
      options.callback()
    }
    return
  }

  const type = TRANSITION_TYPES[options.type] || TRANSITION_TYPES.CLOSE_IN_Y_FAST

  if (type == TRANSITION_TYPES.CLOSE_IN_Y_FAST) {
    const { width, height } = scene.scale
    const rectShape = new Phaser.Geom.Rectangle(0, 0, width, height)
    const g = scene.add.graphics().fillRectShape(rectShape).setDepth(-1)
    const mask = g.createGeometryMask()
    scene.cameras.main.setMask(mask)

    scene.tweens.add({
      onUpdate: () => {
        g.clear().fillRectShape(rectShape)
      },
      delay: 200,
      duration: 800,
      height: {
        ease: Phaser.Math.Easing.Expo.InOut,
        from: height,
        start: height,
        to: 0
      },
      y: {
        ease: Phaser.Math.Easing.Expo.InOut,
        from: 0,
        start: 0,
        to: height / 2
      },
      targets: rectShape,
      onComplete: () => {
        if (options.callback) {
          options.callback()
        }
        // mask.destroy()
        // scene.cameras.main.clearMask()
      }
    })
  } else if (type === TRANSITION_TYPES.LEFT_RIGHT_DOWN_SLOW) {

    const { width, height } = scene.scale
    const worldView = scene.cameras.main.worldView

    const ogDepths = []
    if (options?.spritesToNotBeObscured) {
      options.spritesToNotBeObscured.forEach(sprite => {
        ogDepths.push(sprite.depth)
        sprite.setDepth(99)
      })
    }

    // array of all tile positions
    const tilePositions = []
    for (let y = 0; y < height / TILE_SIZE; y++) {
      for (let x = 0; x < width / TILE_SIZE; x++) {
        tilePositions.push({
          x: worldView.x + x * TILE_SIZE + TILE_SIZE / 2,
          y: worldView.y + y * TILE_SIZE + TILE_SIZE / 2
        })
      }
    }

    const totalDuration = 2500
    const delayPerTile = totalDuration / tilePositions.length

    tilePositions.forEach((tp, i) => {
      scene.time.delayedCall(i * delayPerTile, () => {
        scene.add.rectangle(tp.x, tp.y, TILE_SIZE + 1, TILE_SIZE + 1, 0x000000)
        if (i === tilePositions.length - 1 && options?.callback) {
          if (options?.spritesToNotBeObscured) {
            options.spritesToNotBeObscured.forEach((sprite, i) => {
              sprite.setDepth(ogDepths[i])
            })
          }
          scene.time.delayedCall(500, () => {
            options.callback()
          })
        }
      })
    })
  }
}

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {object} [options] 
 * @param {() => void} [options.callback] 
 * @param {Phaser.GameObjects.Sprite[]} [options.spritesToNotBeObscured=[]]
 * @param {boolean} [options.skipSceneTransition=false]
 */
export function createWildEncounterSceneTransition (scene, options) {
  const skipSceneTransition = options?.skipSceneTransition || false
  if (skipSceneTransition) {
    if (options?.callback) {
      options.callback()
    }
    return
  }

  const ogDepths = []
  /** @type {import("../types/typedef").Coordinate} */
  const refPointForShape = { x: options?.spritesToNotBeObscured[0].x || 0, y: options?.spritesToNotBeObscured[0].y || 0 }

  if (options?.spritesToNotBeObscured) {
    options.spritesToNotBeObscured.forEach(sprite => {
      ogDepths.push(sprite.depth)
      sprite.setDepth(99)
    })
  }

  const steps = [
    0x88ffcc,
    0x88ccff,
    0x000000,
    0x88ffcc,
    0x88ccff,
    0xffffff,
    0x88ffcc,
    0x88ccff,
    0x000000,
    0x88ffcc,
    0x88ccff,
    0xffffff,
    0x88ffcc,
    0x88ccff,
    0x000000,
    0x88ffcc,
    0x88ccff,
    0xffffff
  ]

  const tintOverlay = scene.add.rectangle(
    refPointForShape.x,
    refPointForShape.y,
    scene.scale.width * 2,
    scene.scale.height * 2
  )

  let currentStep = 0
  const nextAnimation = () => {
    const isBlackOrWhite = steps[currentStep] === 0xffffff || steps[currentStep] === 0x000000
    tintOverlay.setFillStyle(steps[currentStep], 1)
    scene.tweens.add({
      targets: tintOverlay,
      duration: isBlackOrWhite ? 125 : 50,
      alpha: {
        start: 1,
        from: 0.5,
        to: isBlackOrWhite ? 1 : 0.5,
        ease: Phaser.Math.Easing.Linear
      },
      yoyo: isBlackOrWhite,
      onComplete: () => {
        currentStep++
        if (currentStep < steps.length - 1) {
          nextAnimation()
          return
        }
        tintOverlay.setAlpha(0)
        if (options?.spritesToNotBeObscured) {
          options.spritesToNotBeObscured.forEach((sprite, i) => {
            sprite.setDepth(ogDepths[i])
          })
        }
        if (options?.callback) {
          options.callback()
        }
      }
    })
  }

  nextAnimation()
}
