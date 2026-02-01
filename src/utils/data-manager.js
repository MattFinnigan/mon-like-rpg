import Phaser from "../lib/phaser.js";
import { USE_DEV_DATA, TILE_SIZE } from "../../config.js";
import { DIRECTION } from "../types/direction.js";
import { ITEM_KEY } from "../generated/item-keys.js";
import { DATA_ASSET_KEYS } from "../assets/asset-keys.js";
import { DataUtils } from "./data-utils.js";

const LOCAL_STORAGE_KEY = 'MF_MON_DATA'
const DEV_LOCAL_STORAGE_KEY = 'DEV_MF_MON_DATA'

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
    DataUtils.getDefaultSaveData().then(res => {
      const { DEV, NORMAL } = res
      this.#store = new Phaser.Data.DataManager(this)
      this.#updateDataManager(USE_DEV_DATA ? DEV : NORMAL)
    })
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
   * @param {import("../types/typedef.js").GlobalState} data
   * @returns {void} 
   */
  #updateDataManager (data) {
    console.log(data)
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
