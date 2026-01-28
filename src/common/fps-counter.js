
export class FpsCounter {
  /** @type {Phaser.Scene} */
  #scene
  /** @type {Phaser.GameObjects.Text} */
  #gameObject

  /**
   * 
   * @param {Phaser.Scene} scene 
   */
  constructor (scene) {
    this.#scene = scene
    this.#createFpsCounter()
  }

  update () {
    const fps = Math.round(this.#scene.game.loop.actualFps)
    this.#gameObject.setText(`FPS ${fps}`)
  }

  #createFpsCounter () {
    this.#gameObject = this.#scene.add.text(0, 0, '').setScrollFactor(0)
  }
}