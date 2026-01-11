import { SCENE_KEYS } from "../scenes/scene-keys.js"

/**
 * @typedef {keyof typeof ITEM_KEY} ItemKey
 */

/** @enum {ItemKey} */
export const ITEM_KEY = Object.freeze({
  POKEBALL: 'POKEBALL',
  POTION: 'POTION',
  REPEL: 'REPEL',
  KEY_CARD: 'KEY_CARD'
})

/**
 * @typedef {keyof typeof ITEM_TYPE_KEY} ItemTypeKey
 */

/** @enum {ItemTypeKey} */
export const ITEM_TYPE_KEY = Object.freeze({
  BALL: 'BALL',
  HEALING: 'HEALING',
  REPELLENT: 'REPELLENT',
  QUEST: 'QUEST'
})

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