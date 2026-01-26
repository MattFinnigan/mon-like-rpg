import { BGM_ASSET_KEYS, MON_ASSET_KEYS, MON_GRAY_ASSET_KEYS } from '../assets/asset-keys.js'
import { BattleMon } from '../battle/mons/battle-mon.js'
import { DialogUi } from '../common/dialog-ui.js'
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js'
import { Controls } from '../utils/controls.js'
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js'
import { DataUtils } from '../utils/data-utils.js'
import { loadMonAssets } from '../utils/load-assets.js'
import { SCENE_KEYS } from './scene-keys.js'

export class EvolveScene extends Phaser.Scene {
  /** @type {import('../types/typedef.js').Mon[]} */
  #evolvingFromMonsQueue
  /** @type {import('../types/typedef.js').BaseMon[]} */
  #evolvingToMonsQueue
  /** @type {Phaser.GameObjects.Container} */
  #phaserEvolvingMonContainer
  /** @type {DialogUi} */
  #dialogUi
  /** @type {import('../types/typedef.js').Mon} */
  #currentEvolvingFrom
  /** @type {import('../types/typedef.js').BaseMon} */
  #currentEvolvingTo
  /** @type {Phaser.GameObjects.Image} */
  #phaserCurrentEvolvingFromGameImage
  /** @type {Phaser.GameObjects.Image} */
  #phaserCurrentEvolvingToGameImage
  /** @type {Controls} */
  #controls
  /** @type {AudioManager} */
  #audioManager

  constructor () {
    super({
      key: SCENE_KEYS.EVOLVE_SCENE
    })
  }

  /**
   * @param {{
   *  toEvolve: import('../types/typedef.js').Mon[]
   * }} data
   */
  init (data) {
    this.#evolvingFromMonsQueue = data.toEvolve
  }


  create () {
    console.log(`[${EvolveScene.name}:create] invoked`)

    this.cameras.main.fadeIn(500, 255, 255, 255)
    this.cameras.main.setBackgroundColor('#fff')
    
    this.#evolvingToMonsQueue = this.#evolvingFromMonsQueue.map(mon => {
      const evolvesFrom = DataUtils.getBaseMonDetails(this, mon.baseMonIndex)
      return DataUtils.getBaseMonDetails(this, evolvesFrom.evolvesTo)
    })

    this.#controls = new Controls(this)
    this.#dialogUi = new DialogUi(this)
    this.#audioManager = this.registry.get('audio')
    this.#phaserEvolvingMonContainer = this.add.container(200, 100)

    this.#currentEvolvingFrom = this.#evolvingFromMonsQueue.shift()
    this.#currentEvolvingTo = this.#evolvingToMonsQueue.shift()
    this.#createEvolvingMonsGameObjects()
    this.#startEvolutionSequence()
  }

  update () {
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
    const wasBackKeyPressed = this.#controls.wasBackKeyPressed()

    if ((wasSpaceKeyPresed || wasBackKeyPressed) && this.#dialogUi.isWaitingForInput) {
      if (this.#evolvingFromMonsQueue.length) {
        this.#currentEvolvingFrom = this.#evolvingFromMonsQueue.shift()
        this.#currentEvolvingTo = this.#evolvingToMonsQueue.shift()
        this.#createEvolvingMonsGameObjects()
        this.#startEvolutionSequence()
        return
      }
      this.scene.start(SCENE_KEYS.WORLD_SCENE)
    }
  }

  #createEvolvingMonsGameObjects() {
    const evolvingFromBase = DataUtils.getBaseMonDetails(this, this.#currentEvolvingFrom.baseMonIndex)
    this.#phaserCurrentEvolvingFromGameImage = this.add.image(0, 0, MON_ASSET_KEYS[evolvingFromBase.assetKey])
      .setOrigin(0)
    this.#phaserCurrentEvolvingToGameImage = this.add.image(0, 0, MON_GRAY_ASSET_KEYS[this.#currentEvolvingTo.assetKey + '_GRAY'])
      .setOrigin(0)
      .setAlpha(0)
    this.#phaserEvolvingMonContainer.add([
      this.#phaserCurrentEvolvingFromGameImage,
      this.#phaserCurrentEvolvingToGameImage
    ])
  }

  #startEvolutionSequence() {
    const evolvingFromBase = DataUtils.getBaseMonDetails(this, this.#currentEvolvingFrom.baseMonIndex)
    this.#dialogUi.showDialogModalNoInputRequired([`What's happening?!?`])
    this.#audioManager.playBgm(BGM_ASSET_KEYS.EVOLUTION)
    this.time.delayedCall(1500, () => {
      // const duration = 5000
      const acceleration = 0.8
      const minInterval = 30
      
      let currentInterval = 1000

      this.#phaserCurrentEvolvingFromGameImage.setTexture(MON_GRAY_ASSET_KEYS[evolvingFromBase.assetKey + '_GRAY'])
      let showingA = 1
      let count = 0

      const flashOnce = () => {
        this.#phaserCurrentEvolvingFromGameImage.setAlpha(0)
        this.#phaserCurrentEvolvingToGameImage.setAlpha(1)
        count++

        if (count > 35) {
          this.#finishEvolution()
          return
        }
        showingA = showingA ? 0 : 1
        
        currentInterval = Math.max(minInterval, currentInterval * acceleration)

        this.time.delayedCall(50, () => {
          this.#phaserCurrentEvolvingToGameImage.setAlpha(0)
          this.#phaserCurrentEvolvingFromGameImage.setAlpha(1)

          this.time.delayedCall(currentInterval, () => {
            flashOnce()
          })
        })
      }

      flashOnce()
    })
  }

  #finishEvolution () {
    const partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)

    const withEvolved = partyMons.map(mon => {
      if (mon.id === this.#currentEvolvingFrom.id) {
        mon.baseMonIndex = this.#currentEvolvingTo.baseMonIndex
        mon.name = this.#currentEvolvingTo.name
      }
      return mon
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS, withEvolved)
    dataManager.saveData()
      
    this.time.delayedCall(500, () => {
      this.#audioManager.stopBgm(BGM_ASSET_KEYS.EVOLUTION)
      this.#audioManager.playSfx(BGM_ASSET_KEYS.MON_CAUGHT, { primaryAudio: true })
      this.#phaserCurrentEvolvingToGameImage.setTexture(MON_ASSET_KEYS[this.#currentEvolvingTo.assetKey])
      this.#phaserCurrentEvolvingFromGameImage.setAlpha(0)
      this.#phaserCurrentEvolvingToGameImage.setAlpha(1)
      this.#dialogUi.showDialogModalAndWaitForInput([`${this.#currentEvolvingFrom.name} evolved into a ${this.#currentEvolvingTo.name}!`])
    })
  }
}