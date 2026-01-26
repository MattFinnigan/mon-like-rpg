import Phaser from "../lib/phaser.js"
/**
 * @typedef AnimateTextConfig
 * @type {object}
 * @property {() => void} [callback]
 * @property {number} [delay=25]
 */

/**
 * 
 * @param {Phaser.Scene} scene 
 * @param {Phaser.GameObjects.BitmapText|Phaser.GameObjects.Text} target 
 * @param {string} text 
 * @param {AnimateTextConfig} [config] 
 * @returns {Phaser.Time.TimerEvent}
 */
export function animateText (scene, target, text, config) {
  const length = text.length
  let i = 0
  return scene.time.addEvent({
    callback: () => {
      target.text += text[i]
      ++i
      if (i === length - 1 && config?.callback) {
        config.callback()
      }
    },
    repeat: length - 1,
    delay: config?.delay || 20
  })
}

export const CANNOT_READ_SIGN_TEXT = 'YOU CANNOT READ THE SIGN FROM THIS DIRECTION'
export const PLACEHOLDER_TEXT = '...'