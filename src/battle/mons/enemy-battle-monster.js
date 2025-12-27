import { BATTLE_ASSET_KEYS } from "../../assets/asset-keys.js";
import { BattleMon } from "./battle-mon.js";

export class EnemyBattleMon extends BattleMon {
  /**
   * 
   * @param {import("../../types/typedef").BattleMonConfig} config 
   */
  constructor (config) {
    super(config)
    this._phaserMonImageGameObject.setFlipX(true)
  }
}