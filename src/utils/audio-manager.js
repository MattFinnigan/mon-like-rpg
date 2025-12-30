const BASE_VOLUMNE = 0.2

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
    this.#bgm.setVolume(BASE_VOLUMNE)
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
      this.#bgm.setVolume(BASE_VOLUMNE / 2)
    }

    this.#sfx = this.#scene.sound.add(key)
    this.#sfx.setVolume(BASE_VOLUMNE)
    this.#sfx.play()
    this.#sfx.once('complete', () => {
      if (this.#bgm?.isPlaying) {
        this.#bgm.setVolume(BASE_VOLUMNE)
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