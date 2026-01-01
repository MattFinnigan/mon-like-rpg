import { SYSTEM_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { DIALOG_DETAILS } from "../assets/consts.js"
import { animateText, CANNOT_READ_SIGN_TEXT } from "../utils/text-utils.js"

export class DialogUi {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.GameObjects.Container} */
  #container
  /** @type {boolean} */
  #isVisible
  /** @type {Phaser.GameObjects.Image} */
  #userInputCursor
  /** @type {Phaser.Tweens.Tween} */
  #userInputCursorTween
  /** @type {Phaser.GameObjects.BitmapText} */
  #uiText
  /** @type {boolean} */
  #textAnimationPlaying
  /** @type {string[]} */
  #messagesToShow
  
  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#textAnimationPlaying = false
    this.#messagesToShow = []

    const panel =  this.#scene.add.image(0, 0, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0).setScale(1.25)
    this.#container = this.#scene.add.container(0, 0, [panel])
    this.#uiText = this.#scene.add.bitmapText(DIALOG_DETAILS.paddingLeft * 2, DIALOG_DETAILS.paddingTop, 'gb-font', CANNOT_READ_SIGN_TEXT, 40)
      .setMaxWidth(DIALOG_DETAILS.maxTextWidth(this.#scene.scale.width))
    this.#container.add(this.#uiText)
    this.#createPlayerInputCursor()
    this.hideDialogModal()
  }

  /** @returns {boolean} */
  get isVisible () {
    return this.#isVisible
  }

  /** @returns {boolean} */
  get isAnimationPlaying () {
    return this.#textAnimationPlaying
  }

  /** @returns {boolean} */
  get moreMessagesToShow () {
    return this.#messagesToShow.length > 0
  }
  
  /**
   * 
   * @param {string[]} messages
   * @returns {void}
   */
  showDialogModal (messages) {
    this.#messagesToShow = [...messages]
    const { x, bottom } = this.#scene.cameras.main.worldView
    const startX = x
    const startY = bottom - (DIALOG_DETAILS.height * 1.5)

    this.#container.setPosition(startX, startY)
    this.#container.setAlpha(1)
    this.#isVisible = true
    this.#userInputCursorTween.play()

    this.showNextMessage()
  }

  /**
   * 
   * @returns {void}
   */
  showNextMessage () {
    if (this.#messagesToShow.length === 0) {
      return
    }

    this.#uiText.setText('').setAlpha(1)
    animateText(this.#scene, this.#uiText, this.#messagesToShow.shift(), {
      delay: 25,
      callback: () => {
        this.#textAnimationPlaying = false
      }
    })
    this.#textAnimationPlaying = true
  }

  /**
   * 
   * @returns {void}
   */
  hideDialogModal () {
    this.#container.setAlpha(0)
    this.#isVisible = false
    this.#userInputCursorTween.pause()
  }

  /**
   * 
   * @returns {void}
   */
  #createPlayerInputCursor () {
    const y = DIALOG_DETAILS.height +   (DIALOG_DETAILS.paddingTop / 2)
    const x = DIALOG_DETAILS.maxTextWidth(this.#scene.scale.width)
    this.#userInputCursor = this.#scene.add.image(x, y, UI_ASSET_KEYS.CURSOR, 0).setAngle(90)
    this.#userInputCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      y: {
        from: y,
        start: y,
        to: y + 6
      },
      targets: this.#userInputCursor
    })
    this.#userInputCursorTween.pause()
    this.#container.add(this.#userInputCursor)
  }
}