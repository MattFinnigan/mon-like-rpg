/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {object} [options] 
 * @param {() => void} [options.callback] 
 * @param {Phaser.GameObjects.Sprite[]} [options.spritesToNotBeObscured=[]]
 * @param {boolean} [options.skipSceneTransition=false] 
 */
export function createBattleSceneTransition (scene, options) {
  const skipSceneTransition = options?.skipSceneTransition || false
  if (skipSceneTransition) {
    if (options?.callback) {
      options.callback()
    }
    return
  }

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
      mask.destroy()
      scene.cameras.main.clearMask()
      if (options.callback) {
        options.callback()
      }
    }
  })
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
