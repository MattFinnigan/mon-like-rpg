import { VOLUME } from "../../config.js"

export class AudioManager {
  /** @type {Phaser.Scene} */
  #scene
  #bgm
  #sfx

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
  }

  /**
   * 
   * @param {string} key 
   */
  playBgm (key) {
    if (this.#bgm?.isPlaying) {
      this.#bgm.stop()
      this.#scene.sound.removeByKey(key)
    }
    this.#bgm = this.#scene.sound.add(key)
    this.#bgm.setVolume(VOLUME)
    this.#bgm.play({ loop: true })
  }

  /**
   * 
   * @param {string} key 
   */
  stopBgm (key) {
    if (!this.#bgm?.isPlaying) {
      return
    }
    this.#bgm.stop(key)
    this.#scene.sound.removeByKey(key)
  }
  
  /**
   * 
   * @param {string} key 
   * @param {() => void} [callback]
   */
  playSfx (key, callback) {
    if (this.#sfx?.isPlaying) {
      return
    }

    if (this.#bgm?.isPlaying) {
      this.#bgm.setVolume(VOLUME / 2)
    }

    this.#sfx = this.#scene.sound.add(key)
    this.#sfx.setVolume(VOLUME)
    this.#sfx.play()
    this.#sfx.once('complete', () => {
      if (this.#bgm?.isPlaying) {
        this.#bgm.setVolume(VOLUME)
        if (callback) {
          callback()
        }
      }
    })
  }

  /**
   * 
   * @param {string} key 
   */
  stopSfx (key) {
    if (!this.#sfx?.isPlaying) {
      return
    }
    this.#sfx.stop(key)
    this.#scene.sound.removeByKey(key)
  }
}