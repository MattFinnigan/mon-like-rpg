import Phaser from "../lib/phaser.js";
import { TILE_SIZE } from "../../config.js";
import { DIRECTION } from "../types/direction.js";
import { ITEM_KEY } from "../types/items.js";

const LOCAL_STORAGE_KEY = 'MF_MON_DATA'
/**
 * @typedef GlobalState
 * @type {object}
 * @property {object} player
 * @property {object} player.position
 * @property {number} player.position.x
 * @property {number} player.position.y
 * @property {import("../types/direction").Direction} player.direction
 * @property {string} player.name
 * @property {import("../types/typedef.js").Mon[]} player.partyMons
 * @property {import("../types/typedef.js").Inventory} player.inventory
 */

/** @type {GlobalState} */
const initalState = {
  player: {
    position: {
      x: 7 * TILE_SIZE,
      y: 42 * TILE_SIZE
    },
    direction: DIRECTION.DOWN,
    name: 'SPONION',
    partyMons: [
      {
        baseMonIndex: 149,
        name: 'MEWTWO',
        currentHp: 193,
        currentLevel: 99,
        attackEV: 14,
        defenseEV: 3,
        splAttackEV: 27,
        splDefenseEV: 8,
        speedEV: 19,
        hpEV: 22,
        attackIds: [1, 2]
      },
      {
        baseMonIndex: 15,
        name: 'PIDGEY',
        currentHp: 85,
        currentLevel: 50,
        attackEV: 5,
        defenseEV: 29,
        splAttackEV: 11,
        splDefenseEV: 16,
        speedEV: 2,
        hpEV: 35,
        attackIds: [2]
      }
    ],
    inventory: [
      { itemKey: ITEM_KEY.POKEBALL, qty: 5 },
      { itemKey: ITEM_KEY.POTION, qty: 2 },
      { itemKey: ITEM_KEY.REPEL, qty: 3 },
      { itemKey: ITEM_KEY.KEY_CARD, qty: 1 }
    ]
  }
}

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
  PLAYER_NAME: 'PLAYER_NAME',
  PLAYER_PARTY_MONS: 'PLAYER_PARTY_MONS',
  PLAYER_INVENTORY: 'PLAYER_INVENTORY',
})

class DataManager extends Phaser.Events.EventEmitter {
  /** @type {Phaser.Data.DataManager} */
  #store
  constructor () {
    super()
    this.#store = new Phaser.Data.DataManager(this)
    this.#updateDataManager(initalState)
  }

  /** @type {Phaser.Data.DataManager} */
  get store () {
    return this.#store
  }

  loadData () {
    if (typeof Storage === undefined) {
      console.warn('Cannot get data - local storage not supported')
      return
    }
    
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedData === null) {
      return
    }

    try {
      const parsedData = JSON.parse(savedData)
      this.#updateDataManager(parsedData)
    } catch (error) {
      console.warn('encounted an error attempting to load and parse saved data')
    }
  }

  saveData () {
    if (typeof Storage === undefined) {
      console.warn('Cannot save data - local storage not supported')
      return
    }

    const dataToSave = this.#updateDataManagerDataToGlobalStateObject()
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave))
  }

  /**
   * 
   * @param {GlobalState} data
   * @returns {void} 
   */
  #updateDataManager (data) {
    this.#store.set({
      [DATA_MANAGER_STORE_KEYS.PLAYER_POSITION]: data.player.position,
      [DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION]: data.player.direction,
      [DATA_MANAGER_STORE_KEYS.PLAYER_NAME]: data.player.name,
      [DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS]: data.player.partyMons,
      [DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY]: data.player.inventory,
    })
  }

  #updateDataManagerDataToGlobalStateObject () {
    return {
      player: {
        position: {
          x: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).x,
          y: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION).y
        },
        direction: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
        name: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_NAME),
        partyMons: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS),
        inventory: this.#store.get(DATA_MANAGER_STORE_KEYS.PLAYER_INVENTORY)
      }
    }
  }
}

export const dataManager = new DataManager()
