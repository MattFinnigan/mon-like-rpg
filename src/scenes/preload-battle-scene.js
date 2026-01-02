import { OPPONENT_TYPES } from "../common/opponent-types.js";
import { DataUtils } from "../utils/data-utils.js";
import { exhaustiveGuard } from "../utils/guard.js";
import { loadMonAssets } from "../utils/load-assets.js";
import { SCENE_KEYS } from "./scene-keys.js";

export class PreloadBattleScene extends Phaser.Scene {
  /** @type {OPPONENT_TYPES} */
  #opponentType
  /** @type {import("../types/typedef.js").BaseMon[]} */
  #monsToLoad
  /** @type {import("../types/typedef.js").Mon | undefined} */
  #opponentWildMon
  /** @type {import("../types/typedef.js").Trainer | undefined} */
  #opponentTrainer

  constructor () {
    super({
      key: SCENE_KEYS.PRELOAD_BATTLE_SCENE
    })
    this.#monsToLoad = []
    this.#opponentWildMon = undefined
    this.#opponentTrainer = undefined
  }

  /**
   * 
   * @param {object} data
   * @param {OPPONENT_TYPES} data.type
   * @param {import('../types/typedef.js').Trainer} [data.trainer]
   * @param {import('../types/typedef.js').WildMon} [data.wildMon]
   */
  init (data) {
    // load player mons
    const player = DataUtils.getPlayerDetails(this)
    this.#monsToLoad = this.#monsToLoad.concat(
      player.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
    )

    // load opponent's mons
    this.#opponentType = data.type

    switch (this.#opponentType) {
      case OPPONENT_TYPES.WILD_ENCOUNTER:
        const generatedWildMon = DataUtils.generateWildMon(this, data.wildMon.encounterArea)
        this.#monsToLoad.push(generatedWildMon.baseMon)
        this.#opponentWildMon = generatedWildMon.mon
        break
      case OPPONENT_TYPES.GYM_LEADER:
      case OPPONENT_TYPES.TRAINER:
        this.#opponentTrainer = data.trainer
        this.#monsToLoad = this.#monsToLoad.concat(this.#opponentTrainer.mons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex)))
        break
      default:
        exhaustiveGuard(this.#opponentType)
    }
  }

  preload () {
    console.log(`[${PreloadBattleScene.name}:preload] invoked`)
    this.#monsToLoad.forEach(baseMon => {
      loadMonAssets(this, baseMon)
    })
    this.load.on('complete', () => {
      this.scene.start(SCENE_KEYS.BATTLE_SCENE, {
        type: this.#opponentType,
        mon: this.#opponentWildMon,
        trainer: this.#opponentTrainer
      })
    })
  }
}