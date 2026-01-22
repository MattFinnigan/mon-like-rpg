import { UI_ASSET_KEYS } from "../assets/asset-keys.js"

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {import("../types/typedef").Coordinate} coords
 * @param {number} width 
 * @param {number} height
 * @returns {Phaser.GameObjects.Container}
 */
export function createDialogUIGameObjectContainer (scene, coords, width, height) {
    height += 5
    const { x, y } = coords
    const bg = scene.add.rectangle(x, y, width, height)
    bg.setOrigin(0, 0)

    const CORNER_WIDTH = 35
    const CORNER_HEIGHT = 37

    const borderTopLeft = scene.add.image(0, 0, UI_ASSET_KEYS.DIALOG_BORDER_TOP_LEFT).setOrigin(0, 0)
    const borderTop = scene.add.image(CORNER_WIDTH, 0, UI_ASSET_KEYS.DIALOG_BORDER_TOP).setOrigin(0, 0)

    const borderLeft = scene.add.image(0, CORNER_HEIGHT, UI_ASSET_KEYS.DIALOG_BORDER_LEFT).setOrigin(0, 0)
    const borderBottomLeft = scene.add.image(0, height - CORNER_HEIGHT, UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM_LEFT).setOrigin(0, 0)

    const borderBottom = scene.add.image(CORNER_WIDTH, height - CORNER_HEIGHT + 6, UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM).setOrigin(0, 0)
    const borderBottomRight = scene.add.image(width - CORNER_WIDTH, height - CORNER_HEIGHT, UI_ASSET_KEYS.DIALOG_BORDER_BOTTOM_RIGHT).setOrigin(0, 0)

    const borderTopRight = scene.add.image(width - CORNER_WIDTH, 0, UI_ASSET_KEYS.DIALOG_BORDER_TOP_RIGHT).setOrigin(0, 0)
    const borderRight = scene.add.image(width - CORNER_WIDTH + 5, 0 + CORNER_HEIGHT, UI_ASSET_KEYS.DIALOG_BORDER_RIGHT).setOrigin(0, 0)

    borderTop.displayWidth = width - (CORNER_WIDTH * 2)
    borderLeft.displayHeight = height - (CORNER_HEIGHT * 2)
    borderBottom.displayWidth = width - (CORNER_WIDTH * 2)
    borderRight.displayHeight = height - (CORNER_HEIGHT * 2)
    
    const g = scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(0, 0, width, height)

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