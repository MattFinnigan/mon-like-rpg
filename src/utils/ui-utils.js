import { TEXTURE_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/asset-keys.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").Coordinate} coords
 * @param {number} width 
 * @param {number} height
 * @returns {Phaser.GameObjects.Container}
 */
export function createDialogUIGameObjectContainer (scene, coords, width, height) {
    const CORNER_WIDTH = 32 * 1.5
    const CORNER_HEIGHT = 32 * 1.5

    height += 5
    let { x, y } = coords

    x = x - CORNER_WIDTH

    const bg = scene.add.rectangle(x, y, width, height)
    bg.setOrigin(0, 0)

    const borderTopLeft = scene.add.image(0, 0, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_TOP_LEFT).setScale(1.5).setOrigin(0, 0)
    const borderTop = scene.add.image(CORNER_WIDTH, 0, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_TOP).setScale(1.5).setOrigin(0, 0)

    const borderLeft = scene.add.image(0, CORNER_HEIGHT, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_LEFT).setScale(1.5).setOrigin(0, 0)
    const borderBottomLeft = scene.add.image(0, height - CORNER_HEIGHT, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_BOTTOM_LEFT).setScale(1.5).setOrigin(0, 0)

    const borderBottom = scene.add.image(CORNER_WIDTH, height - 33, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_BOTTOM).setScale(1.5).setOrigin(0, 0)
    const borderBottomRight = scene.add.image(width - CORNER_WIDTH, height - CORNER_HEIGHT, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_BOTTOM_RIGHT).setScale(1.5).setOrigin(0, 0)

    const borderTopRight = scene.add.image(width - CORNER_WIDTH, 0, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_TOP_RIGHT).setScale(1.5).setOrigin(0, 0)
    const borderRight = scene.add.image(width - 36, CORNER_HEIGHT, TEXTURE_ASSET_KEYS.SYSTEM, UI_ASSET_KEYS.BORDER_RIGHT).setScale(1.5).setOrigin(0, 0)

    borderTop.displayWidth = width - (CORNER_WIDTH * 2)
    borderLeft.displayHeight = height - (CORNER_HEIGHT * 2)
    borderBottom.displayWidth = width - (CORNER_WIDTH * 2)
    borderRight.displayHeight = height - (CORNER_HEIGHT * 2)
    
    const g = scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(20, 20, width - 40, height - 40)

    return scene.add.container(x, y, [
      g,
      borderTopLeft,
      borderTop,
      borderTopRight,
      borderLeft,
      borderBottomLeft,
      borderBottom,
      borderBottomRight,
      borderRight
    ])
}