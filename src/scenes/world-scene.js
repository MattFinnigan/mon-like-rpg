import { SKIP_BATTLE_ANIMATIONS, TILE_SIZE, TILED_COLLISION_ALPHA } from '../../config.js';
import { BGM_ASSET_KEYS, CHARACTER_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { DIRECTION } from '../common/direction.js';
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js';
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { createBattleSceneTransition, createWildEncounterSceneTransition } from '../utils/scene-transition.js';
import { CANNOT_READ_SIGN_TEXT, PLACEHOLDER_TEXT } from '../utils/text-utils.js';
import { NPC } from '../world/characters/npc.js';
import { Player } from '../world/characters/player.js';
import { DialogUi } from '../world/dialog-ui.js';
import { SCENE_KEYS } from "./scene-keys.js";

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path'
})

const TILED_NPC_PROPERTY = Object.freeze({
  IS_SPAWN_POINT: 'is_spawn_point',
  MOVEMENT_PATTERN: 'movement_pattern',
  FRAME: 'frame',
  SHEET: 'sheet'
})

/**
 * @typedef TiledObjectProperty
 * @type {object}
 * @property {string} name
 * @property {string} type
 * @property {any} value
 */

export class WorldScene extends Phaser.Scene {
  /** @type {Player} */
  #player
  /** @type {Controls} */
  #controls
  /** @type {Phaser.Tilemaps.TilemapLayer} */
  #encounterLayer
  /** @type {boolean} */
  #wildMonEncountered
  /** @type {Phaser.GameObjects.Image} */
  #worldBackgroundImage
  /** @type {Phaser.GameObjects.Image} */
  #worldForegroundImage
  /** @type {Phaser.Tilemaps.ObjectLayer} */
  #signLayer
  /** @type {DialogUi} */
  #dialogUi
  /** @type {AudioManager} */
  #audioManager
  /** @type {NPC[]} */
  #npcs

  constructor () {
    super({
      key: SCENE_KEYS.WORLD_SCENE
    })
  }

  init () {
    this.#wildMonEncountered = false
  }

  create () {
    console.log(`[${WorldScene.name}:create] invoked`)

    const x = 6 * TILE_SIZE
    const y = 22 * TILE_SIZE
    const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL })
  
    // collision
    const collisonTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION)
    if (!collisonTiles) {
      console.log(`[${WorldScene.name}:create] encounted error while creating collision TILESET using data from tiled`)
      return
    }
    const collisionLayer = map.createLayer('Collision', collisonTiles, 0, 0)
    if (!collisionLayer) {
      console.log(`[${WorldScene.name}:create] encounted error while creating collision LAYER using data from tiled`)
      return
    }
    collisionLayer.setAlpha(TILED_COLLISION_ALPHA).setDepth(2)

    // encounter
    const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE)
    if (!encounterTiles) {
      console.log(`[${WorldScene.name}:create] encounted error while creating Encounter TILESET using data from tiled`)
      return
    }
    this.#encounterLayer = map.createLayer('Encounter', encounterTiles, 0, 0)
    if (!this.#encounterLayer) {
      console.log(`[${WorldScene.name}:create] encounted error while creating Encounter LAYER using data from tiled`)
      return
    }
    this.#encounterLayer.setAlpha(TILED_COLLISION_ALPHA).setDepth(2)

    // interactives
    this.#signLayer = map.getObjectLayer('Signs')
    if (!this.#signLayer) {
      console.log(`[${WorldScene.name}:create] encounted error while creating Signs LAYER using data from tiled`)
      return
    }

    this.#worldBackgroundImage = this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0)
    this.cameras.main.setBounds(0, 0, this.#worldBackgroundImage.width, this.#worldBackgroundImage.height)
    this.cameras.main.setZoom(0.8)
    this.cameras.main.centerOn(x, y)

    this.#createNPCs(map)

    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
      collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate()
      },
      otherCharactersToChckecForCollisionsWith: this.#npcs
    })
  
    this.cameras.main.startFollow(this.#player.sprite)
    
    this.cameras.main.fadeIn(500, 255, 255, 255)
    this.#worldForegroundImage = this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0)

    this.#audioManager = this.registry.get('audio')
    this.#audioManager.playBgm(BGM_ASSET_KEYS.CELADON_CITY)

    this.#npcs.forEach(npc => {
      npc.addCharacterToCheckForcollsionsWith(this.#player)
    })

    this.#dialogUi = new DialogUi(this)
    this.#controls = new Controls(this)
  }

  update (time) {
    if (this.#wildMonEncountered) {
      this.#player.update(time)
      return
    }
  
    // process player input
    const selectedDirection = this.#controls.getDirectionKeyPressedDown()
    if (selectedDirection !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
      this.#player.moveCharacter(selectedDirection)
    }

    if (this.#controls.wasSpaceKeyPressed() && !this.#player.isMoving) {
      this.#handlePlayerInteraction()
    }

    this.#player.update(time)
    this.#npcs.forEach(npc => {
      npc.update(time)
    })
  }

  #handlePlayerInteraction () {
    if (this.#dialogUi.isAnimationPlaying) {
      return
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal()
      return
    }

    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage()
      return
    }

    const { x, y } = this.#player.sprite
    const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction)

    const nearbySign = this.#signLayer.objects.find(object => {
      if (!object.x || !object.y) {
        return
      }
      return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y
    })
    if (nearbySign) {
      /** @type {TiledObjectProperty[]} */
      const props = nearbySign.properties
      /** @type {string} */
      const msg = props.find(p => p.name === 'message')?.value
      
      const usePlaceholderText = this.#player.direction !== DIRECTION.UP
      let textToShow = CANNOT_READ_SIGN_TEXT

      if (!usePlaceholderText) {
        textToShow = msg || PLACEHOLDER_TEXT
      }
      this.#dialogUi.showDialogModal([textToShow.toUpperCase(), 'hello'])
      return
    }
  }

  #handlePlayerMovementUpdate () {
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction)
    if (!this.#encounterLayer) {
      return
    }

    const isInEncounterZone = this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true).index !== -1
    if (!isInEncounterZone) {
      return
    }

    this.#wildMonEncountered = Math.random() < 0.5
    if (this.#wildMonEncountered) {
      this.#audioManager.playBgm(BGM_ASSET_KEYS.WILD_ENCOUNTER_BATTLE)
      createWildEncounterSceneTransition(this, {
        skipSceneTransition: SKIP_BATTLE_ANIMATIONS,
        spritesToNotBeObscured: [this.#player.sprite],
        callback: () => {
          createBattleSceneTransition(this, {
            skipSceneTransition: SKIP_BATTLE_ANIMATIONS,
            spritesToNotBeObscured: [this.#player.sprite],
            callback: () => {
              this.scene.start(SCENE_KEYS.BATTLE_SCENE)
            }
          })
        }}
      )
    }
  }

  #isPlayerInputLocked () {
    return this.#dialogUi.isVisible
  }
  
  /**
   * 
   * @param {Phaser.Tilemaps.Tilemap} map 
   */
  #createNPCs (map) {
    this.#npcs = []

    const npcLayers = map.getObjectLayerNames().filter(layerName => layerName.includes('NPC'))
    npcLayers.forEach(layerName => {
      const layer = map.getObjectLayer(layerName)
      const npcObject = layer.objects.find(obj => {
        return obj.type === CUSTOM_TILED_TYPES.NPC
      })
      if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
        return
      }

      const npcSheet = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.SHEET)?.value || '1'
      const npcFrame = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.FRAME)?.value || '0'

      const npc = new NPC({
        scene: this,
        assetKey: CHARACTER_ASSET_KEYS['NPC_' + npcSheet],
        position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
        direction: DIRECTION.DOWN,
        frame: parseInt(npcFrame, 10)
      })

      this.#npcs.push(npc)
    })
  }
}