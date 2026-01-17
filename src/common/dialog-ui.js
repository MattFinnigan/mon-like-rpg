import { SKIP_ANIMATIONS } from "../../config.js"
import { SYSTEM_ASSET_KEYS, UI_ASSET_KEYS } from "../assets/asset-keys.js"
import { DIRECTION } from "../types/direction.js"
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
  /** @type {(optionSelected?: string) => void} */
  #onFinish
  /** @type {boolean} */
  #isWaitingForInput
  /** @type {string[]} */
  #dialogOptions
  /** @type {Phaser.GameObjects.Container} */
  #phaserOptionsContainer
  /** @type {Phaser.GameObjects.Image} */
  #optionsCursor
  /** @type {Phaser.Tweens.Tween} */
  #optionsCursorTween
  /** @type {number} */
  #currentOptionIndex = 0
  /** @type {boolean} */
  #optionSelectRequired
  /** @type {boolean} */
  #isWaitingOnOptionSelect
  
  /**
   * 
   * @param {Phaser.Scene} scene
   * @param {string[]} [dialogOptions=[]]
   */
  constructor (scene, dialogOptions = []) {
    this.#scene = scene
    this.#textAnimationPlaying = false
    this.#messagesToShow = []
    this.#onFinish = undefined
    this.#isWaitingForInput = false
    this.#dialogOptions = dialogOptions
    this.#currentOptionIndex = 0
    this.#optionSelectRequired = false
    this.#isWaitingOnOptionSelect = false

    const panel =  this.#scene.add.image(0, 0, SYSTEM_ASSET_KEYS.DIALOG_BACKGROUND).setOrigin(0)
    this.#container = this.#scene.add.container(0, 0, [panel]).setDepth(1)
    this.#uiText = this.#scene.add.bitmapText(DIALOG_DETAILS.paddingLeft, DIALOG_DETAILS.paddingTop, 'gb-font', CANNOT_READ_SIGN_TEXT, 30).setMaxWidth(DIALOG_DETAILS.maxTextWidth(this.#scene.scale.width))
    this.#container.add(this.#uiText)

    this.#createPlayerInputCursor()
    this.#createOptionsContainer()
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

  /** @returns {boolean} */
  get isWaitingOnOptionSelect () {
    return this.#isWaitingOnOptionSelect
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
   * @param {(optionSelected: string) => void} [callback] 
   */
  showDialogModalAndWaitForOptionSelect (messages, callback) {
    this.#userInputCursorTween.restart()
    this.#userInputCursor.setAlpha(1)
    this.#isWaitingForInput = true
    this.#optionSelectRequired = true
    this.#container.setDepth(3)
    this.#showDialogModal(messages, callback)
  }

  /**
   * 
   * @param {string[]} messages
   * @param {(optionSelected?: string) => void} [callback]
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
      this.#handleNoMessagesLeft()
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
   * @param {string|null} optionSelected
   */
  #handleNoMessagesLeft (optionSelected = null) {
    if (this.#isWaitingForInput) {
      if (this.#optionSelectRequired) {
        this.#openOptionsDialog()
        return
      }

      this.#isWaitingForInput = false
      this.hideDialogModal()

      if (this.#onFinish) {
        this.#onFinish(optionSelected)
        this.#onFinish = undefined
      }

    }
    this.#container.setDepth(1)
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

  #createOptionsContainer () {
    if (!this.#dialogOptions.length) {
      return
    }

    const containerWidth = 150
    const containerHeight = 110

    const containerX = this.#scene.scale.width - 4 - containerWidth
    const containerY = DIALOG_DETAILS.y - containerHeight

    const g = this.#scene.add.graphics()
    g.fillStyle(0xFFFFFF, 1)
    g.fillRect(0, 0, containerWidth, containerHeight)
    g.lineStyle(4, 0x000000, 1)
    g.strokeRect(0, 0, containerWidth, containerHeight)

    const options = this.#dialogOptions.map((option, i) => {
      return this.#scene.add.bitmapText(40, 10 + (50 * i), 'gb-font', option, 40).setOrigin(0).setDepth(2)
    })

    this.#phaserOptionsContainer = this.#scene.add.container(containerX, containerY, [g, ...options]).setDepth(2).setAlpha(0)

    this.#optionsCursor = this.#scene.add.image(10, 20, UI_ASSET_KEYS.CURSOR, 0).setOrigin(0).setDepth(2)

    this.#optionsCursorTween = this.#scene.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      x: {
        from: 10,
        start: 10,
        to: 16
      },
      targets: this.#optionsCursor
    })
    this.#optionsCursorTween.pause()
    this.#phaserOptionsContainer.add(this.#optionsCursor)
  }

  #openOptionsDialog () {
    this.#isWaitingOnOptionSelect = true
    this.#phaserOptionsContainer.setAlpha(1)
    this.#currentOptionIndex = 0
    this.#optionsCursorTween.restart()
  }

  #hideOptionsDialog () {
    this.#isWaitingOnOptionSelect = false
    this.#currentOptionIndex = 0
    this.#optionsCursorTween.pause()
    this.#phaserOptionsContainer.setAlpha(0)
  }

  /**
   * 
   * @param {import("../types/direction.js").Direction} direction 
   */
  moveOptionsCursor (direction) {
    if (direction === DIRECTION.DOWN) {
      this.#moveCursorDown()
      return
    }
    if (direction === DIRECTION.UP) {
      this.#moveCursorUp()
      return
    }
  }

  #moveCursorDown () {
    let availableOptionsLen = this.#dialogOptions.length
    this.#currentOptionIndex += 1

    if (this.#currentOptionIndex > availableOptionsLen - 1) {
      this.#currentOptionIndex = 0
    }
    this.#optionsCursor.setPosition(
      this.#optionsCursor.x,
      10 + (50 * this.#currentOptionIndex) 
    )
  }

  #moveCursorUp () {
    let availableOptionsLen = this.#dialogOptions.length
    this.#currentOptionIndex -= 1

    if (this.#currentOptionIndex < 0) {
      this.#currentOptionIndex = availableOptionsLen - 1
    }
    this.#optionsCursor.setPosition(
      this.#optionsCursor.x,
      10 + (50 * this.#currentOptionIndex) 
    )
  }

  selectCurrentOption () {
    this.#optionSelectRequired = false
    this.#handleNoMessagesLeft(this.#dialogOptions[this.#currentOptionIndex])
    this.#hideOptionsDialog()
  }
}

