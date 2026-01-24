import { VOLUME } from "../../config.js"

export class AudioManager {
  /** @type {Phaser.Scene} */
  #scene
  #bgm
  #sfx
  /** @type {boolean} */
  #sfxIsPlaying
  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#sfxIsPlaying = false
  }

  /**
   * @returns {boolean}
   */
  get sfxIsPlaying () {
    return this.#sfxIsPlaying
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
   * @param {object} [config]
   * @param {boolean} [config.primaryAudio=false] 
   * @param {() => void} [config.callback]
   */
  playSfx (key, config) {
    let sfxVolume = VOLUME / 3
    if (this.#bgm?.isPlaying && config?.primaryAudio) {
      this.#bgm.setVolume(VOLUME / 2)
    }
    this.#sfxIsPlaying = true
    this.#sfx = this.#scene.sound.add(key)
    this.#sfx.setVolume(config?.primaryAudio ? VOLUME / 1.5 : sfxVolume)
    this.#sfx.play()
    this.#sfx.once('complete', () => {
      this.#sfxIsPlaying = false
      if (this.#bgm?.isPlaying) {
        this.#bgm.setVolume(VOLUME)
      }
      if (config?.callback) {
        config.callback()
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
    this.#sfxIsPlaying = false
    this.#sfx.stop(key)
    this.#scene.sound.removeByKey(key)
  }
}