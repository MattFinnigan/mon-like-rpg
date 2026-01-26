import Phaser from "../lib/phaser.js";
import { USE_DEV_DATA, TILE_SIZE } from "../../config.js";
import { DIRECTION } from "../types/direction.js";
import { ITEM_KEY } from "../types/items.js";

const LOCAL_STORAGE_KEY = 'MF_MON_DATA'
const DEV_LOCAL_STORAGE_KEY = 'DEV_MF_MON_DATA'

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
 * @property {object} npcs
 * @property {import("../types/typedef.js").Coordinate[]} npcs.positions
 * @property {import("../types/direction").Direction[]} npcs.directions
 */

/** @type {GlobalState} */
const initalState = {
  player: {
    position: {
      x: 112 * TILE_SIZE,
      y: 180 * TILE_SIZE
    },
    direction: DIRECTION.DOWN,
    name: 'YOU',
    partyMons: [
      {
        id: 1,
        baseMonIndex: 24,
        name: 'PIKACHU',
        currentHp: 46,
        currentLevel: 25,
        attackEV: 5,
        defenseEV: 29,
        splAttackEV: 11,
        splDefenseEV: 16,
        speedEV: 2,
        hpEV: 35,
        attackIds: [2],
        currentExp: 13000
      },
      {
        id: 2,
        baseMonIndex: 57,
        name: 'GROWLITHE',
        currentHp: 50,
        currentLevel: 25,
        attackEV: 5,
        defenseEV: 29,
        splAttackEV: 11,
        splDefenseEV: 16,
        speedEV: 2,
        hpEV: 35,
        attackIds: [3, 2],
        currentExp: 12500
      },
      {
        id: 3,
        baseMonIndex: 130,
        name: 'LAPRAS',
        currentHp: 62,
        currentLevel: 25,
        attackEV: 5,
        defenseEV: 29,
        splAttackEV: 11,
        splDefenseEV: 16,
        speedEV: 2,
        hpEV: 35,
        attackIds: [1],
        currentExp: 12510
      }
    ],
    inventory: [
      { itemKey: ITEM_KEY.POKEBALL, qty: 20 },
      { itemKey: ITEM_KEY.POTION, qty: 20 },
      { itemKey: ITEM_KEY.REPEL, qty: 3 },
      { itemKey: ITEM_KEY.KEY_CARD, qty: 1 }
    ]
  },
  npcs: {
    positions: [],
    directions: []
  }
}

/** @type {GlobalState} */
const devInitialState = {
  player: {
    position: {
      x: 112 * TILE_SIZE,
      y: 180 * TILE_SIZE
    },
    direction: DIRECTION.DOWN,
    name: 'YOU',
    partyMons: [
      {
        id: 1123123,
        baseMonIndex: 3,
        name: '123',
        currentHp: 900000,
        currentLevel: 8,
        attackEV: 14,
        defenseEV: 3,
        splAttackEV: 27,
        splDefenseEV: 8,
        speedEV: 19,
        hpEV: 22,
        attackIds: [3, 4, 5, 6],
        currentExp: 506.6
      },
      {
        id: 1,
        baseMonIndex: 149,
        name: 'DEV GOD MON',
        currentHp: 900000,
        currentLevel: 99,
        attackEV: 14,
        defenseEV: 3,
        splAttackEV: 27,
        splDefenseEV: 8,
        speedEV: 19,
        hpEV: 22,
        attackIds: [1, 2, 3],
        currentExp: 799999
      },
      {
        id: 2,
        baseMonIndex: 150,
        name: 'TANK',
        currentHp: 900000,
        currentLevel: 1,
        attackEV: 1,
        defenseEV: 29,
        splAttackEV: 1,
        splDefenseEV: 16,
        speedEV: 1,
        hpEV: 35,
        attackIds: [2],
        currentExp: 1
      },
      {
        id: 3,
        baseMonIndex: 6,
        name: 'FODDER',
        currentHp: 1,
        currentLevel: 1,
        attackEV: 1,
        defenseEV: 29,
        splAttackEV: 1,
        splDefenseEV: 16,
        speedEV: 1,
        hpEV: 35,
        attackIds: [2],
        currentExp: 1
      }
    ],
    inventory: [
      { itemKey: ITEM_KEY.POKEBALL, qty: 5 },
      { itemKey: ITEM_KEY.POTION, qty: 20 },
      { itemKey: ITEM_KEY.REPEL, qty: 3 },
      { itemKey: ITEM_KEY.KEY_CARD, qty: 1 }
    ]
  },
  npcs: {
    positions: [],
    directions: []
  }
}

export const DATA_MANAGER_STORE_KEYS = Object.freeze({
  PLAYER_POSITION: 'PLAYER_POSITION',
  PLAYER_DIRECTION: 'PLAYER_DIRECTION',
  PLAYER_NAME: 'PLAYER_NAME',
  PLAYER_PARTY_MONS: 'PLAYER_PARTY_MONS',
  PLAYER_INVENTORY: 'PLAYER_INVENTORY',
  NPC_POSITIONS: 'NPC_POSITIONS',
  NPC_DIRECTIONS: 'NPC_DIRECTIONS'
})

class DataManager extends Phaser.Events.EventEmitter {
  /** @type {Phaser.Data.DataManager} */
  #store
  constructor () {
    super()
    this.#store = new Phaser.Data.DataManager(this)
    this.#updateDataManager(USE_DEV_DATA ? devInitialState : initalState)
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
    
    const savedData = localStorage.getItem(USE_DEV_DATA ? DEV_LOCAL_STORAGE_KEY : LOCAL_STORAGE_KEY)
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

  saveGame () {
    if (typeof Storage === undefined) {
      console.warn('Cannot save data - local storage not supported')
      return
    }

    const dataToSave = this.#updateDataManagerDataToGlobalStateObject()
    localStorage.setItem(USE_DEV_DATA ? DEV_LOCAL_STORAGE_KEY : LOCAL_STORAGE_KEY, JSON.stringify(dataToSave))
  }

  saveData () {
    this.#updateDataManagerDataToGlobalStateObject()
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
      [DATA_MANAGER_STORE_KEYS.NPC_POSITIONS]: data.npcs.positions,
      [DATA_MANAGER_STORE_KEYS.NPC_DIRECTIONS]: data.npcs.directions
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
      },
      npcs: {
        positions: this.#store.get(DATA_MANAGER_STORE_KEYS.NPC_POSITIONS),
        directions: this.#store.get(DATA_MANAGER_STORE_KEYS.NPC_DIRECTIONS)
      }
    }
  }
}

export const dataManager = new DataManager()
