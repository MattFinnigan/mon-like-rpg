import { SKIP_BATTLE_ANIMATIONS, TILE_SIZE, TILED_COLLISION_ALPHA, WORLD_ZOOM } from '../../config.js';
import { BGM_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, TRAINER_SPRITES, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { DIRECTION } from '../common/direction.js';
import { EVENT_KEYS } from '../common/event-keys.js';
import { OPPONENT_TYPES } from '../common/opponent-types.js';
import { TRANSITION_TYPES } from '../common/transition-types.js';
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js';
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { DataUtils } from '../utils/data-utils.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { createBattleSceneTransition, createWildEncounterSceneTransition } from '../utils/scene-transition.js';
import { CANNOT_READ_SIGN_TEXT, PLACEHOLDER_TEXT } from '../utils/text-utils.js';
import { NPC } from '../world/characters/npc.js';
import { Player } from '../world/characters/player.js';
import { DialogUi } from '../common/dialog-ui.js';
import { SCENE_KEYS } from "./scene-keys.js";
import { exhaustiveGuard } from '../utils/guard.js';
import { loadBattleAssets, loadMonAssets, loadTrainerSprites } from '../utils/load-assets.js';
import { generateWildMon } from '../utils/encounter-utils.js';

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path',
  ENCOUNTER: 'encounter'
})

const TILED_NPC_PROPERTY = Object.freeze({
  IS_SPAWN_POINT: 'is_spawn_point',
  MOVEMENT_PATTERN: 'movement_pattern',
  FRAME: 'frame',
  SHEET: 'sheet',
  MESSAGE: 'message',
  ACTION: 'action',
  ACTION_ID: 'action_id'
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
  /** @type {NPC | undefined} */
  #npcPlayerIsInteractingWith
  /** @type {string} */
  #bgmKey
  /** @type {boolean} */
  #isTransitioning

  constructor () {
    super({
      key: SCENE_KEYS.WORLD_SCENE
    })
  }

  init () {
    this.#wildMonEncountered = false
    this.#npcPlayerIsInteractingWith = undefined
    this.#bgmKey = BGM_ASSET_KEYS.PALLET_TOWN
    this.#isTransitioning = false
  }

  preload () {
    this.load.audio(this.#bgmKey, [`assets/audio/bgm/${this.#bgmKey}.flac`])
    this.load.audio(BGM_ASSET_KEYS.TRAINER, [`assets/audio/bgm/TRAINER.flac`])
    this.load.audio(BGM_ASSET_KEYS.WILD_ENCOUNTER, [`assets/audio/bgm/WILD_ENCOUNTER.flac`])
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
    this.cameras.main.centerOn(x, y)
    this.cameras.main.setZoom(WORLD_ZOOM)

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
    this.#audioManager.playBgm(this.#bgmKey)

    this.#npcs.forEach(npc => {
      npc.addCharacterToCheckForcollsionsWith(this.#player)
    })

    this.events.on(EVENT_KEYS.TRAINER_BATTLE_START, data => {
      this.#isTransitioning = true
      /** @type {NPC} */

      this.#audioManager.playBgm(BGM_ASSET_KEYS.TRAINER)

      const promises = [
        this.#preloadBattleAssets({
          type: OPPONENT_TYPES.TRAINER,
          trainer: {
            type: OPPONENT_TYPES.TRAINER,
            ...DataUtils.getTrainerDetails(this, data.actionId)
          }
        }),
        createBattleSceneTransition(this, {
          skipSceneTransition: SKIP_BATTLE_ANIMATIONS,
          spritesToNotBeObscured: [this.#player.sprite, data.npc.sprite],
          type: TRANSITION_TYPES.LEFT_RIGHT_DOWN_SLOW
        })
      ]

      Promise.all(promises).then(data => {
        /** @type {import('../types/typedef.js').BattleSceneConfig} */
        const config = data[0]

        this.#isTransitioning = false
        this.scene.start(SCENE_KEYS.BATTLE_SCENE, config)
      })

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
      if (this.#npcPlayerIsInteractingWith) {
        this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false
        this.#npcPlayerIsInteractingWith = undefined
      }
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
      this.#dialogUi.showDialogModal([textToShow.toUpperCase()])
      return
    }

    const nearbyNpc = this.#npcs.find(npc => {
      if (!npc.sprite.x || !npc.sprite.y) {
        return
      }
      return npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y
    })

    if (nearbyNpc) {
      nearbyNpc.facePlayer(this.#player.direction)
      nearbyNpc.isTalkingToPlayer = true
      this.#npcPlayerIsInteractingWith = nearbyNpc
      this.#dialogUi.showDialogModal(nearbyNpc.messages)
      return
    }

    this.scene.start(SCENE_KEYS.PARTY_SCENE)
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
    /** @type {Phaser.Tilemaps.Tile} */
    const tileLandedOn = this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true)
    const isInEncounterZone = tileLandedOn.index !== -1
    if (!isInEncounterZone) {
      return
    }
    /** @type {number} */
    const areaId = tileLandedOn.properties.area
    if (!areaId) {
      return
    }

    const encounterArea = DataUtils.getEncoutnerConfig(this, areaId)

    this.#wildMonEncountered = encounterArea.encounterRate > Math.random()
    if (this.#wildMonEncountered) {

      this.#isTransitioning = true
      this.#audioManager.playBgm(BGM_ASSET_KEYS.WILD_ENCOUNTER)    

      const promises = [
        this.#preloadBattleAssets({
          type: OPPONENT_TYPES.WILD_ENCOUNTER,
          encounterArea
        }),
        createWildEncounterSceneTransition(this, {
          skipSceneTransition: SKIP_BATTLE_ANIMATIONS,
          spritesToNotBeObscured: [this.#player.sprite]
        })
      ]

      Promise.all(promises).then(data => {
        /** @type {import('../types/typedef.js').BattleSceneConfig} */
        const config = data[0]
        
        this.#isTransitioning = false
        this.scene.start(SCENE_KEYS.BATTLE_SCENE, config)
      })
    }
  }

  #isPlayerInputLocked () {
    return this.#dialogUi.isVisible || this.#isTransitioning
  }
  
  /**
   * 
   * @param {Phaser.Tilemaps.Tilemap} map 
   */
  #createNPCs (map) {
    this.#npcs = []
    let index = 0

    const npcLayers = map.getObjectLayerNames().filter(layerName => layerName.includes('NPC'))
    npcLayers.forEach(layerName => {
      const layer = map.getObjectLayer(layerName)
      const npcObject = layer.objects.find(obj => obj.type === CUSTOM_TILED_TYPES.NPC)
      if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
        return
      }

      const pathObjects = layer.objects.filter(obj => obj.type === CUSTOM_TILED_TYPES.NPC_PATH)
      const npcPath = {
        0: { x: npcObject.x, y: npcObject.y - TILE_SIZE }
      }

      pathObjects.forEach(obj => {
        if (obj.x === undefined || obj.y === undefined) {
          return
        }
        npcPath[parseInt(obj.name, 10)] = { x: obj.x, y: obj.y - TILE_SIZE }
      })

      const npcSheet = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.SHEET)?.value || '1'
      const npcMessagesStr = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.MESSAGE)?.value || ''

      const npcFrame = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.FRAME)?.value || '0'
      const npcMessages = npcMessagesStr.split(';;')

      const npcMovement = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN)?.value || 'IDLE'
      const npcAction = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.ACTION)?.value || 'NONE'
      const npcActionId = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.ACTION_ID)?.value || undefined

      const npc = new NPC(this, {
        scene: this,
        assetKey: CHARACTER_ASSET_KEYS['NPC_SHEET_' + npcSheet],
        position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
        direction: DIRECTION.DOWN,
        frame: parseInt(npcFrame, 10),
        messages: npcMessages,
        npcPath,
        movementPattern: npcMovement,
        action: npcAction,
        actionId: npcActionId
      })
      this.#npcs.push(npc)
    })

  }

  /**
   * @param {object} data
   * @param {OPPONENT_TYPES} data.type
   * @param {import('../types/typedef.js').Trainer} [data.trainer]
   * @param {import('../types/typedef.js').EncounterAreaConfig} [data.encounterArea]
   * @returns {Promise}
   */
  #preloadBattleAssets (data) {
    return new Promise(resolve => {
      const config = {
        generatedMon: null,
        trainer: data.trainer,
        type: data.type
      }

      /** @type {import('../types/typedef.js').BaseMon[]} */
      let baseMonsToPreload = []

      const playerData = DataUtils.getPlayerDetails(this)
      const partyBaseMons = playerData.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))

      baseMonsToPreload = baseMonsToPreload.concat(partyBaseMons)

      switch (data.type) {
        case OPPONENT_TYPES.WILD_ENCOUNTER:
          config.generatedMon = generateWildMon(this, data.encounterArea)
          baseMonsToPreload.push(config.generatedMon.baseMon)
          break
        case OPPONENT_TYPES.TRAINER:
        case OPPONENT_TYPES.GYM_LEADER:
          const enemyBaseMons = data.trainer.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
          baseMonsToPreload = baseMonsToPreload.concat(enemyBaseMons)
          break
        default:
          exhaustiveGuard(data.type)
          break
      }
  
      this.load.once('complete', () => {
        console.log('done!')
        resolve(config)
      })

      baseMonsToPreload.forEach(baseMon => {
        loadMonAssets(this, baseMon)
      })
  
      if (data.type !== OPPONENT_TYPES.WILD_ENCOUNTER) {
        loadTrainerSprites(this, data.trainer.assetKey)
      }
      loadTrainerSprites(this, TRAINER_SPRITES.RED)
      loadBattleAssets(this)

      this.load.start()
    })
  }
}