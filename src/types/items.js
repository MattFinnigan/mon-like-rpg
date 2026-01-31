import { SCENE_KEYS } from "../scenes/scene-keys.js"

export const ITEM_TYPE_DATA = Object.freeze({
  /** @type {import("./typedef.js").ItemType} */
  BALL: {
    usableDuringScenes: [SCENE_KEYS.BATTLE_SCENE]
  },
  /** @type {import("./typedef.js").ItemType} */
  HEALING: {
    usableDuringScenes: [SCENE_KEYS.BATTLE_SCENE, SCENE_KEYS.WORLD_SCENE]
  },
  /** @type {import("./typedef.js").ItemType} */
  REPELLENT: {
    usableDuringScenes: [SCENE_KEYS.WORLD_SCENE]
  },
  /** @type {import("./typedef.js").ItemType} */
  QUEST: {
    usableDuringScenes: [SCENE_KEYS.WORLD_SCENE]
  }
})