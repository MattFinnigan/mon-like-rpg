import { MonCore } from "../common/mon-core.js"
import { SCENE_KEYS } from "../scenes/scene-keys.js"
import { EVENT_KEYS } from "../types/event-keys.js"
import { ITEM_TYPE_DATA, ITEM_TYPE_KEY } from "../types/items.js"
import { DATA_MANAGER_STORE_KEYS, dataManager } from "./data-manager.js"

/**
 * 
 * @param {Phaser.Scene} scene
 * @param {object} config
 * @param {import("../types/typedef").Item} config.item
 * @param {(result: {
 *   wasUsed: boolean,
 *   msg: string,
 *   wasSuccessful?: boolean
 * }) => void} config.callback
 * @param {MonCore} [config.mon] 
 * @param {MonCore} [config.enemyMon] 
 */
export function playItemEffect (scene, config) {
  const { item, mon, enemyMon, callback } = config
  if (!canUseItemInScene(scene, item)) {
    callback({
      wasUsed: false,
      msg: `You can't use that right now...`
    })
    return
  }
  switch (item.typeKey) {
    case ITEM_TYPE_KEY.HEALING:
      if (mon.currentHealth === mon.maxHealth) {
        callback({
          wasUsed: false,
          msg: `${mon.name} is already full health!`
        })
        return
      }

      mon.healHp(item.value, () => {
        callback({
          wasUsed: true,
          msg: `${mon.name} was healed for ${item.value} hitpoints`
        })
      })
      consumeItem(item)
      scene.events.emit(EVENT_KEYS.ITEM_CONSUMED, item)
      break
    case ITEM_TYPE_KEY.BALL:
      if (!enemyMon.isWild) {
        callback({
          wasUsed: false,
          msg: `You can't catch another trainer's POKEMON ya cheeky bugger!`
        })
        return
      }
      
      const partyMons = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)
      if (partyMons.length > 5) {
        callback({
          wasUsed: false,
          msg: `You already have the max amount of POKEMON (6)`
        })
        return
      }

      enemyMon.playCatchAttempt(item, (result) => {
        callback({
          wasUsed: true,
          msg: result.msg,
          wasSuccessful: result.wasSuccessful
        })
      })
      break
    default:
      callback({
        wasUsed: false,
        msg: `Nothing happened...`
      })
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

export function consumeItem (item) {
  const updatedInventory = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY).filter(invItem => {
    if (invItem.itemKey === item.key) {
      invItem.qty--
    }
    return invItem.qty > 0
  })

  dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY, updatedInventory)
  dataManager.saveData()
}