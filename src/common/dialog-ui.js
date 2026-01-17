import { SKIP_ANIMATIONS } from "../../config.js"
import { SYSTEM_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { DIALOG_DETAILS } from "../utils/consts.js"
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
  /** @type {Phaser.Time.TimerEvent} */
  #currentTextEvent
  /** @type {() => void} */
  #onFinish
  /** @type {boolean} */
  #isWaitingForInput
  
  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#textAnimationPlaying = false
    this.#messagesToShow = []
    this.#onFinish = undefined
    this.#isWaitingForInput = false
  
    const panel =  this.#scene.add.image(0, 0, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
    this.#container = this.#scene.add.container(0, 0, [panel]).setDepth(1)
    this.#uiText = this.#scene.add.bitmapText(DIALOG_DETAILS.paddingLeft, DIALOG_DETAILS.paddingTop, 'gb-font', CANNOT_READ_SIGN_TEXT, 30).setMaxWidth(DIALOG_DETAILS.maxTextWidth(this.#scene.scale.width))
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

  /** @returns {boolean} */
  get isWaitingForInput () {
    return this.#isWaitingForInput
  }

  /**
   * 
   * @param {string[]} messages 
   * @param {() => void} [callback] 
   */
  showDialogModalAndWaitForInput (messages, callback) {
    this.#userInputCursorTween.restart()
    this.#userInputCursor.setAlpha(1)
    this.#isWaitingForInput = true
    this.#container.setDepth(3)
    this.#showDialogModal(messages, callback)
  }

  /**
   * 
   * @param {string[]} messages 
   */
  showDialogModalNoInputRequired (messages) {
    this.#container.setDepth(1)
    this.#userInputCursorTween.pause()
    this.#userInputCursor.setAlpha(0)
    this.#showDialogModal(messages)
  }

  /**
   * 
   * @param {string[]} messages
   * @param {() => void} [callback]
   * @returns {void}
   */
  #showDialogModal (messages, callback) {
    this.#messagesToShow = [...messages]
    const { x, bottom } = this.#scene.cameras.main.worldView
    const startX = x
    const startY = bottom - (DIALOG_DETAILS.height * 1.2)

    this.#container.setPosition(startX, startY)
    this.#container.setAlpha(1)
    this.#isVisible = true

    this.#onFinish = callback
    this.showNextMessage()
  }

  /**
   * @returns {void}
   */
  showNextMessage () {
    if (this.#messagesToShow.length === 0) {
      if (this.#isWaitingForInput) {
        this.#isWaitingForInput = false
        this.hideDialogModal()

        if (this.#onFinish) {
          this.#onFinish()
          this.#onFinish = undefined
        }
      }
      this.#container.setDepth(1)
      return
    }

    if (SKIP_ANIMATIONS) {
      this.#uiText.setText(this.#messagesToShow.shift()).setAlpha(1)
      return
    }
  
    if (this.#currentTextEvent) {
      this.#scene.time.removeEvent(this.#currentTextEvent)
    }

    this.#uiText.setText('').setAlpha(1)
    this.#currentTextEvent = animateText(this.#scene, this.#uiText, this.#messagesToShow.shift(), {
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
    const y = this.#uiText.y + DIALOG_DETAILS.paddingTop * 2
    const x = this.#scene.scale.width - (DIALOG_DETAILS.paddingLeft * 2)
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