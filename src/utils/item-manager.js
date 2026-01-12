import { MonCore } from "../common/mon-core.js"
import { SCENE_KEYS } from "../scenes/scene-keys.js"
import { EVENT_KEYS } from "../types/event-keys.js"
import { ITEM_TYPE_DATA, ITEM_TYPE_KEY } from "../types/items.js"

/**
 * 
 * @param {Phaser.Scene} scene
 * @param {object} config
 * @param {import("../types/typedef").Item} config.item
 * @param {(wasUsed: boolean, msg: string) => void} config.callback
 * @param {MonCore} [config.mon] 
 */
export function playItemEffect (scene, config) {
  const { item, mon, callback } = config
  if (!canUseItemInScene(scene, item)) {
    callback(false, `You can't use that right now...`)
    return
  }
  switch (item.typeKey) {
    case ITEM_TYPE_KEY.HEALING:
      if (mon.currentHealth === mon.maxHealth) {
        callback(false, `${mon.name} is already full health!`)
        return
      }

      mon.healHp(item.value, () => {
        callback(true, `${mon.name} was healed for ${item.value} hitpoints`)
      })
      scene.events.emit(EVENT_KEYS.CONSUME_ITEM, item)
      break
    default:
      callback(false, `Nothing happened...`)
      break
  }
}

/**
 *  
 * @param {Phaser.Scene} scene
 * @param {import("../types/typedef").Item} item
 * 
 */
export function canUseItemInScene (scene, item) {
  return ITEM_TYPE_DATA[item.typeKey].usableDuringScenes.includes(SCENE_KEYS[scene.scene.key])
}