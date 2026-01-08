import { BATTLE_ASSET_KEYS, MON_BALLS } from "../../assets/asset-keys.js"
import { BattleMon } from "../mons/battle-mon.js"

export class BattleCharacter {
  /** @protected @type {Phaser.Scene} */
  _scene
  /** @protected @type {string} */
  _assetKey
  /** @protected  @type {Phaser.GameObjects.Image} */
  _phaserMonDetailsBackgroundImageGameObject
  /** @protected @type {boolean} */
  _skipBattleAnimations
  /** @protected @type {BattleMon[]} */
  _battleMons
  /** @protected @type {Phaser.GameObjects.Container} */
  _phaserRemainingMonsGameObject
  /** @protected @type {import("../../types/typedef").Coordinate} */
  _remainingMonGameObjectsPos

  /**
   * 
   * @param {Phaser.Scene} scene 
   * @param {object} trainer
   * @param {BattleMon[]} battleMons
   * @param {object} config
   * @param {string} config.assetKey
   * @param {boolean} [config.skipBattleAnimations]
   * @param {import("../../types/typedef.js").Coordinate} [config.remainingMonsPos]
   */
  constructor (scene, trainer, battleMons, config) {
    this._scene = scene
    this._battleMons = battleMons
    this._assetKey = config.assetKey
    this._skipBattleAnimations = config.skipBattleAnimations
    this._remainingMonGameObjectsPos = config.remainingMonsPos || { x: 15, y: -10 }
    this._createRemainingMonsGameObject()
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playCharacterAppearAnimation (callback) {
    throw new Error('playCharacterAppearAnimation is not implemented')
  }

  /**
   * 
   * @param {() => void} callback
   * @returns {void}
   */
  playCharacterDisappearAnimation (callback) {
    throw new Error('playCharacterDisappearAnimation is not implemented')
  }

  remainingMons () {
    return this._battleMons.filter(bm => !bm.isFainted)
  }

  faintedMons () {
    return this._battleMons.filter(bm => bm.isFainted)
  }

  /**
   * 
   * @returns {void}
   */
  showTrainer () {
    throw new Error('showTrainer is not implemented')
  }

  /**
   * 
   * @param {boolean} [flipX] 
   */
  redrawRemainingMonsGameObject (flipX) {
    this._createRemainingMonsGameObject()
    this._phaserMonDetailsBackgroundImageGameObject.setFlipX(flipX)
  }

  showRemainingMons () {
    this._phaserRemainingMonsGameObject.setAlpha(1)
  }

  hideRemainingMons () {
    this._phaserRemainingMonsGameObject.setAlpha(0)
  }

  _createRemainingMonsGameObject () {
    let count = 0
    const remainingMons = this.remainingMons().map(pm => {
      const offsetX = count * 35 + 60
      count++
      return this._scene.add.image(offsetX, 88, MON_BALLS.MON_BALLS_SHEET_1, 9).setScale(0.65)
    })

    const faintedMons = this.faintedMons().map(fm => {
      const offsetX = count * 35 + 60
      count++
      return this._scene.add.image(offsetX, 88, MON_BALLS.MON_BALLS_SHEET_1, 1).setScale(0.65)
    })
    
    this._phaserRemainingMonsGameObject = this._scene.add.container(this._remainingMonGameObjectsPos.x, this._remainingMonGameObjectsPos.y, [
      this._phaserMonDetailsBackgroundImageGameObject = this._scene.add.image(0, 0, BATTLE_ASSET_KEYS.ENEMY_BATTLE_DETAILS_BACKGROUND).setOrigin(0),
      ...remainingMons,
      ...faintedMons
    ])
    this._phaserRemainingMonsGameObject.setAlpha(0)
  }
  
}