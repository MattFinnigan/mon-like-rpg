import { UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { DIRECTION } from "../common/direction.js"

/**
 * @typedef VirtualKey
 * @type {object}
 * @property {boolean} isDown
 * @property {boolean} justDown
 */

/**
 * @typedef VirtualKeyDirection
  * @type {{
   *  LEFT: VirtualKey,
   *  RIGHT: VirtualKey,
   *  UP: VirtualKey,
   *  DOWN: VirtualKey
   * }}
 */

/**
 * @typedef VirtualKeyInteract
  * @type {{
  *  SPACE: VirtualKey,
  *  SHIFT: VirtualKey
   * }}
 */


export class Controls {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  #cursorKeys
  /** @type {boolean} */
  #lockPlayerInput
  /** @type {Phaser.GameObjects.Container} */
  #mobileButtonsContainer
  /** @type {number} */
  #mobileButtonsAlpha
  /** @type {VirtualKeyDirection} */
  #virtualKeyDirections
  /** @type {VirtualKeyInteract} */
  #virtualKeyInteract
  /** @type {Phaser.Input.Keyboard.Key | undefined} */
  #enterKey

  /**
   * 
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.#scene = scene
    this.#cursorKeys = this.#scene.input.keyboard.createCursorKeys()
    this.#lockPlayerInput = false
    this.#mobileButtonsAlpha = 0.3

    this.#virtualKeyDirections = {
      LEFT: { isDown: false, justDown: false },
      RIGHT: { isDown: false, justDown: false },
      UP: { isDown: false, justDown: false },
      DOWN: { isDown: false, justDown: false }
    }

    this.#virtualKeyInteract = {
      SPACE: { isDown: false, justDown: false },
      SHIFT: { isDown: false, justDown: false }
    }

    this.#enterKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.#createMobileButtonsIfNeeded()
  }

  get isInputLocked () {
    return this.#lockPlayerInput
  }

  get mobileButtonsContainer () {
    return this.#mobileButtonsContainer
  }

  /**
   * @param {boolean} val
   */
  set lockInput (val) {
    this.#lockPlayerInput = val
  }

  wasEnterKeyPressed () {
    if (this.#enterKey === undefined) {
      return false
    }
    return Phaser.Input.Keyboard.JustDown(this.#enterKey)
  }

  wasSpaceKeyPressed () {
    if (this.#cursorKeys === undefined) {
      return false
    }
    return this.#isMobile()
      ? this.#consumeJustDown(this.#virtualKeyInteract.SPACE)
      : Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space)
  }

  wasBackKeyPressed () {
    if (this.#cursorKeys === undefined) {
      return false
    }
    return this.#isMobile()
      ?  this.#consumeJustDown(this.#virtualKeyInteract.SHIFT)
      : Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift)
  }

  getDirectionKeyJustPressed () {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE
    }
    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE

    if (this.#isMobile()) {
      Object.keys(this.#virtualKeyDirections).forEach(key => {
        /** @type {VirtualKey} */
        const vKey = this.#virtualKeyDirections[key]
        if (this.#consumeJustDown(vKey)) {
          vKey.justDown = false
          selectedDirection = DIRECTION[key]
        }
      })
    } else {
      if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
        selectedDirection = DIRECTION.LEFT
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
        selectedDirection = DIRECTION.RIGHT
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
        selectedDirection = DIRECTION.UP
      } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
        selectedDirection = DIRECTION.DOWN
      }
    }
    
    return selectedDirection
  }

  getDirectionKeyPressedDown () {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE
    }

    /** @type {import('../common/direction.js').Direction} */
    let selectedDirection = DIRECTION.NONE
    
    if (this.#isMobile()) {
      Object.keys(this.#virtualKeyDirections).forEach(key => {
        /** @type {VirtualKey} */
        const vKey = this.#virtualKeyDirections[key]
        if (vKey.isDown) {
          selectedDirection = DIRECTION[key]
        }
      })
    } else {
      if (this.#cursorKeys.left.isDown) {
        selectedDirection = DIRECTION.LEFT
      } else if (this.#cursorKeys.right.isDown) {
        selectedDirection = DIRECTION.RIGHT
      } else if (this.#cursorKeys.up.isDown) {
        selectedDirection = DIRECTION.UP
      } else if (this.#cursorKeys.down.isDown) {
        selectedDirection = DIRECTION.DOWN
      }
    }

    return selectedDirection
  }
  
  #createMobileButtonsIfNeeded () {
    if (!this.#isMobile()) {
      return
    }
    this.#createArrow(160, 320, 180, DIRECTION.UP)
    this.#createArrow(160, 520, 0, DIRECTION.DOWN)
    this.#createArrow(60, 420, 90, DIRECTION.LEFT)
    this.#createArrow(260, 420, 270, DIRECTION.RIGHT)

    this.#createButton(420, 370, 'B', this.#virtualKeyInteract.SHIFT)
    this.#createButton(570, 420, 'A', this.#virtualKeyInteract.SPACE)
  }
  /**
   * 
   * @param {number} x 
   * @param {number} y 
   * @param {number} angle 
   * @param {import("../common/direction.js").Direction} direction 
   * @returns 
   */
  #createArrow (x, y, angle, direction) {
    const arrow = this.#scene.add.image(x, y, UI_ASSET_KEYS.ARROW)
      .setAngle(angle)
      .setAlpha(this.#mobileButtonsAlpha)
      .setScale(0.65)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0, 0)

    arrow.on('pointerdown', () => {
      arrow.setAlpha(0.8)
      this.#mimicKeyStrokeDown(this.#virtualKeyDirections[direction])
    })
    arrow.on('pointerup', () => {
      arrow.setAlpha(this.#mobileButtonsAlpha)
      this.#mimicKeyStrokeUp(this.#virtualKeyDirections[direction])
    })
    arrow.on('pointerout', () => {
      arrow.setAlpha(this.#mobileButtonsAlpha)
      this.#mimicKeyStrokeUp(this.#virtualKeyDirections[direction])
    })
    return arrow
  }

  /**
   * 
   * @param {number} x 
   * @param {number} y 
   * @param {string} label 
   * @param {VirtualKey} key 
   * @returns 
   */
  #createButton (x, y, label, key) {
    const radius = 55
    const bg = this.#scene.add.circle(0, 0, radius, 0x000000, 1).setAlpha(this.#mobileButtonsAlpha).setScrollFactor(0, 0)

    const text = this.#scene.add.text(0, 0, label, {
      fontSize: '34px',
      color: '#ffff'
    }).setOrigin(0.5).setScrollFactor(0, 0)

    bg.setInteractive({ useHandCursor: true })

    bg.on('pointerdown', () => {
      bg.setAlpha(0.8)
      this.#mimicKeyStrokeDown(key)
    })
    bg.on('pointerup', () => {
      bg.setAlpha(this.#mobileButtonsAlpha)
      this.#mimicKeyStrokeUp(key)
    })
    bg.on('pointerout', () => {
      bg.setAlpha(this.#mobileButtonsAlpha)
      this.#mimicKeyStrokeUp(key)
    })

  
    return this.#scene.add.container(x, y, [bg, text])
  }

  /**
   * 
   * @param {VirtualKey} key 
   */
  #mimicKeyStrokeDown (key) {
    if (!this.#isMobile()) {
      return
    }
    if (!key.isDown) {
      key.justDown = true
    }
    key.isDown = true
  }

  /**
   * 
   * @param {VirtualKey} key 
   */
  #mimicKeyStrokeUp (key) {
    if (!this.#isMobile()) {
      return
    }
    key.justDown = false
    key.isDown = false
  }

  #isMobile () {
    return this.#scene.sys.game.device.input.touch
  }

  /**
   * 
   * @param {VirtualKey} key 
   * @returns 
   */
  #consumeJustDown (key) {
    if (key.justDown) {
      key.justDown = false
      return true
    }
    return false
  }
}