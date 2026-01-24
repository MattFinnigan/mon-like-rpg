import { SKIP_ANIMATIONS, TILE_SIZE, TILED_COLLISION_ALPHA, WORLD_ZOOM } from '../../config.js';
import { BGM_ASSET_KEYS, CHARACTER_ASSET_KEYS, DATA_ASSET_KEYS, SFX_ASSET_KEYS, TRAINER_SPRITES, WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { DIRECTION } from '../types/direction.js';
import { EVENT_KEYS } from '../types/event-keys.js';
import { OPPONENT_TYPES } from '../types/opponent-types.js';
import { TRANSITION_TYPES } from '../types/transition-types.js';
import Phaser from '../lib/phaser.js'
import { AudioManager } from '../utils/audio-manager.js';
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { DataUtils } from '../utils/data-utils.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { createBattleSceneTransition, createWildEncounterSceneTransition } from '../utils/scene-transition.js';
import { PLACEHOLDER_TEXT } from '../utils/text-utils.js';
import { NPC } from '../world/characters/npc.js';
import { Player } from '../world/characters/player.js';
import { DialogUi } from '../common/dialog-ui.js';
import { SCENE_KEYS } from "./scene-keys.js";
import { exhaustiveGuard } from '../utils/guard.js';
import { loadBattleAssets, loadMonAssets, loadTrainerSprites } from '../utils/load-assets.js';
import { generateWildMon } from '../utils/encounter-utils.js';
import { Menu, MENU_OPTIONS } from '../world/menu/menu.js';
import { ItemMenu } from '../common/item-menu.js';
import { PartyMenu } from '../common/party-menu/party-menu.js';
import { ITEM_TYPE_KEY } from '../types/items.js';
import { playItemEffect } from '../utils/item-manager.js';
import { BGM_ASSETS_PATH } from '../utils/consts.js';

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
  ACTION_ID: 'action_id',
  FACING: 'facing'
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
  /** @type {Menu} */
  #menu
  /** @type {ItemMenu} */
  #itemMenu
  /** @type {Phaser.Tilemaps.TilemapLayer} */
  #collisionLayer
  /** @type {PartyMenu} */
  #partyMenu
  /** @type {() => void} */
  #onPartyMonSelection

  constructor () {
    super({
      key: SCENE_KEYS.WORLD_SCENE
    })
  }

  init () {
    this.#resetSceneChangingFlags()
    this.#bgmKey = BGM_ASSET_KEYS.ROUTE_11
  }

  preload () {
    this.load.audio(this.#bgmKey, [`${BGM_ASSETS_PATH}/${this.#bgmKey}.flac`])
    this.load.audio(BGM_ASSET_KEYS.TRAINER_BATTLE, [`${BGM_ASSETS_PATH}/TRAINER_BATTLE.flac`])
    this.load.audio(BGM_ASSET_KEYS.WILD_ENCOUNTER, [`${BGM_ASSETS_PATH}/WILD_ENCOUNTER.flac`])
  }

  create () {
    console.log(`[${WorldScene.name}:create] invoked`)

    const map = this.make.tilemap({ key: WORLD_ASSET_KEYS.WORLD_MAIN_LEVEL })
  
    this.#createWorldLayers(map)
    this.#createBackgroundSetCamera()
    this.#createNPCs(map)
    this.#createPlayer()
    this.#createForeground()
    
    this.#npcs.forEach(npc => {
      npc.addCharacterToCheckForCollsionsWith(this.#player)
    })

    this.cameras.main.fadeIn(500, 255, 255, 255)
    this.#audioManager = this.registry.get('audio')
    this.#audioManager.playBgm(this.#bgmKey)

    this.#menu = new Menu(this)
    this.#partyMenu = new PartyMenu(this)
    this.#partyMenu.depth = 3
    this.#itemMenu = new ItemMenu(this)
    this.#dialogUi = new DialogUi(this)
    this.#controls = new Controls(this)

    this.#setUpEventListeners()
  }

  update (time) {
    if (this.#wildMonEncountered) {
      this.#player.update(time)
      return
    }
  
    const wasSpaceKeyPresed = this.#controls.wasSpaceKeyPressed()
    const selectedDirectionHeldDown = this.#controls.getDirectionKeyPressedDown()
    const selectedDirectionPressedOnce = this.#controls.getDirectionKeyJustPressed()
    const wasBackKeyPressed = this.#controls.wasBackKeyPressed()
    const wasEnterPressed = this.#controls.wasEnterKeyPressed()

    if (this.#dialogUi.isWaitingForInput) {
      if (this.#dialogUi.isAnimationPlaying) {
        return
      }
      if (wasSpaceKeyPresed || wasBackKeyPressed) {
        this.#dialogUi.showNextMessage()
        return
      }
      return
    }

    if (this.#playerCanMove(selectedDirectionHeldDown)) {
      this.#player.moveCharacter(selectedDirectionHeldDown)
    }

    if (wasSpaceKeyPresed && this.#playerCanInteract()) {
      this.#checkForAndHandlePlayerInteraction()
    }

    if (wasEnterPressed && this.#canToggleMenu()) {
      this.#toggleMenu()
      return
    }

    if (this.#menu.isVisible) {
      this.#handleMenuInteraction({ wasSpaceKeyPresed, selectedDirectionPressedOnce, wasBackKeyPressed })
      return
    }

    this.#player.update(time)
    this.#npcs.forEach(npc => {
      npc.update(time)
    })
  }

  /**
   * 
   * @returns {boolean}
   */
  #canToggleMenu () {
    return !this.#isPlayerInputLocked() && !this.#player.isMoving && !this.#partyMenu.isVisible && !this.#itemMenu.isVisible
  }

  /**
   * 
   * @returns {boolean}
   */
  #playerCanInteract () {
    return !this.#isPlayerInputLocked() && !this.#menu.isVisible
  }
  
  #finishDialog () {
    if (this.#npcPlayerIsInteractingWith) {
      this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false
      this.#npcPlayerIsInteractingWith = undefined
    }
  }

  /**
   * 
   * @param {import('../types/typedef.js').Coordinate} targetPosition 
   * @returns {void}
   */
  #checkForAndHandleSignInteraction (targetPosition) {
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
      const textToShow = msg || PLACEHOLDER_TEXT
  
      this.#dialogUi.showDialogModalAndWaitForInput([textToShow.toUpperCase()], () => {
        this.#finishDialog()
      })
      return
    }
  }

  /**
   * 
   * @param {import('../types/typedef.js').Coordinate} targetPosition 
   * @returns {void}
   */
  #checkForAndHandleNpcInteraction (targetPosition) {
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
      this.#dialogUi.showDialogModalAndWaitForInput(nearbyNpc.messages, () => {
        this.#finishDialog()
        if (nearbyNpc.actionPending) {
          nearbyNpc.doAction()
        }
      })
      return
    }
  }

  #checkForAndHandlePlayerInteraction () {
    const { x, y } = this.#player.sprite
    const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction)

    this.#checkForAndHandleSignInteraction(targetPosition)
    this.#checkForAndHandleNpcInteraction(targetPosition)
  }

  #savePlayerPosition () {
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y
    })
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction)
  }

  #saveNpcPositions () {
    const npcPositions = []
    const npcDirections = []

    this.#npcs.forEach(npc => {
      npcPositions.push({
        x: npc.sprite.x,
        y: npc.sprite.y
      })
      npcDirections.push(npc.direction)
    })
    
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.NPC_POSITIONS, npcPositions)
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.NPC_DIRECTIONS, npcDirections)
  }

  /**
   * 
   * @returns {number|undefined}
   */
  #getEncounterAreaId () {
    /** @type {Phaser.Tilemaps.Tile} */
    const tileLandedOn = this.#encounterLayer.getTileAtWorldXY(this.#player.sprite.x, this.#player.sprite.y, true)
    const isInEncounterZone = tileLandedOn.index !== -1
    if (!isInEncounterZone) {
      return undefined
    }
  
    return tileLandedOn.properties.area
  }
  
  /**
   * 
   * @param {import('../types/typedef.js').EncounterAreaConfig} config
   * @returns {boolean}
   */
  #determineWildMonEncountered (config) {
    return config.encounterRate > Math.random()
  }

  #handlePlayerMovementUpdate () {
    this.#savePlayerPosition()

    if (!this.#encounterLayer) {
      return
    }

    const areaId = this.#getEncounterAreaId()
    if (areaId) {
      const encounterArea = DataUtils.getEncoutnerConfig(this, areaId)
      this.#wildMonEncountered = this.#determineWildMonEncountered(encounterArea)
      if (this.#wildMonEncountered) {
        this.#playWildMonEncounteredSequence(encounterArea)
      }
    }
  }

  /**
   * 
   * @param {import('../types/typedef.js').EncounterAreaConfig} encounterArea 
   */
  #playWildMonEncounteredSequence (encounterArea) {
    this.#isTransitioning = true
    this.#audioManager.playBgm(BGM_ASSET_KEYS.WILD_ENCOUNTER)    

    const promises = [
      this.#prepareForBattleScene({
        type: OPPONENT_TYPES.WILD_ENCOUNTER,
        encounterArea
      }),
      createWildEncounterSceneTransition(this, {
        skipSceneTransition: SKIP_ANIMATIONS,
        spritesToNotBeObscured: [this.#player.sprite]
      })
    ]

    Promise.all(promises).then(responses => {
      this.#startBattleScene(responses[0])
    })
  }

  #isPlayerInputLocked () {
    return this.#isTransitioning
  }
  
  /**
   * 
   * @param {Phaser.Tilemaps.Tilemap} map 
   */
  #createNPCs (map) {
    this.#npcs = []

    const savedNpcPositions = dataManager.store.get(DATA_MANAGER_STORE_KEYS.NPC_POSITIONS)
    const savedNpcDirections = dataManager.store.get(DATA_MANAGER_STORE_KEYS.NPC_DIRECTIONS)
    const npcLayers = map.getObjectLayerNames().filter(layerName => layerName.includes('NPC'))
    npcLayers.forEach((layerName, i) => {
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
      const npcFacing = npcObject.properties.find(prop => prop.name === TILED_NPC_PROPERTY.FACING)?.value || 'DOWN'
  
      const npc = new NPC(this, {
        scene: this,
        name: npcObject.name,
        assetKey: CHARACTER_ASSET_KEYS['NPC_SHEET_' + npcSheet],
        position: savedNpcPositions[i] || { x: npcObject.x, y: npcObject.y - TILE_SIZE },
        direction: savedNpcDirections[i] || DIRECTION[npcFacing],
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
  #prepareForBattleScene (data) {
    return new Promise(resolve => {
      this.#savePlayerPosition()
      this.#saveNpcPositions()

      const battleConfig = {
        generatedMon: null,
        trainer: data.trainer,
        type: data.type
      }
      const playerData = this.#getPlayerDataFromStore()

      const partyBaseMons = playerData.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
      let baseMonsToPreload = partyBaseMons
      let enemyTrainerAssetKey = null

      switch (data.type) {
        case OPPONENT_TYPES.WILD_ENCOUNTER:
          battleConfig.generatedMon = generateWildMon(this, data.encounterArea)
          baseMonsToPreload.push(battleConfig.generatedMon.baseMon)
          break
        case OPPONENT_TYPES.TRAINER:
        case OPPONENT_TYPES.GYM_LEADER:
          const enemyBaseMons = data.trainer.partyMons.map(mon => DataUtils.getBaseMonDetails(this, mon.baseMonIndex))
          baseMonsToPreload = baseMonsToPreload.concat(enemyBaseMons)
          enemyTrainerAssetKey = data.trainer.assetKey
          break
        default:
          exhaustiveGuard(data.type)
          break
      }

      this.#preloadBattleSceneAssets(baseMonsToPreload, enemyTrainerAssetKey).then(() => {
        resolve(battleConfig)
      })
    })
  }

  /**
   * 
   * @returns {{
   *   name: string,
   *   partyMons: import('../types/typedef.js').Mon[]
   * }}
   */
  #getPlayerDataFromStore () {
    return {
      name: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_NAME),
      partyMons: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_PARTY_MONS)
    }
  }

  /**
   * 
   * @param {import('../types/typedef.js').BaseMon[]} baseMons 
   * @param {string} enemyTrainerAssetKey 
   * @returns {Promise}
   */
  #preloadBattleSceneAssets (baseMons, enemyTrainerAssetKey = null) {
    return new Promise(resolve => {
      this.load.once('complete', () => {
        resolve()
      })

      baseMons.forEach(baseMon => {
        loadMonAssets(this, baseMon)
      })
  
      if (enemyTrainerAssetKey) {
        loadTrainerSprites(this, enemyTrainerAssetKey)
      }

      loadTrainerSprites(this, TRAINER_SPRITES.RED)
      loadBattleAssets(this)

      this.load.start()
    })
  }

  #resetSceneChangingFlags () {
    this.#wildMonEncountered = false
    this.#npcPlayerIsInteractingWith = undefined
    this.#isTransitioning = false
  }

  /**
   * 
   * @param {Phaser.Tilemaps.Tilemap} map 
   */
  #createWorldLayers (map) {
    // collision
    const collisonTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION)
    if (!collisonTiles) {
      console.log(`[${WorldScene.name}:create] encounted error while creating collision TILESET using data from tiled`)
      return
    }
    this.#collisionLayer = map.createLayer('Collision', collisonTiles, 0, 0)
    if (!this.#collisionLayer) {
      console.log(`[${WorldScene.name}:create] encounted error while creating collision LAYER using data from tiled`)
      return
    }
    this.#collisionLayer.setAlpha(TILED_COLLISION_ALPHA).setDepth(2)

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
  }

  #createBackgroundSetCamera () {
    const x = 6 * TILE_SIZE
    const y = 22 * TILE_SIZE
  
    this.#worldBackgroundImage = this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_BACKGROUND, 0).setOrigin(0)
    this.cameras.main.setBounds(0, 0, this.#worldBackgroundImage.width, this.#worldBackgroundImage.height)
    this.cameras.main.centerOn(x, y)
    this.cameras.main.setZoom(WORLD_ZOOM)
  }

  #createForeground () {
    this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0)
  }

  #createPlayer () {
    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
      collisionLayer: this.#collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate()
      },
      otherCharactersToChckecForCollisionsWith: this.#npcs
    })

    this.cameras.main.startFollow(this.#player.sprite)
  }

  #setUpEventListeners () {
    this.events.on(EVENT_KEYS.TRAINER_BATTLE_START, data => {
      this.#startTrainerBattle(data)
    })
  }
  
  /**
   * 
   * @param {object} data 
   * @param {NPC} data.npc
   * @param {number} data.actionId
   * @param {() => void} data.onTransitionComplete
   */
  #startTrainerBattle (data) {
    this.#isTransitioning = true
    this.#audioManager.playBgm(BGM_ASSET_KEYS.TRAINER_BATTLE)

    const promises = [
      this.#prepareForBattleScene({
        type: OPPONENT_TYPES.TRAINER,
        trainer: {
          type: OPPONENT_TYPES.TRAINER,
          ...DataUtils.getTrainerDetails(this, data.actionId)
        }
      }),
      createBattleSceneTransition(this, {
        skipSceneTransition: SKIP_ANIMATIONS,
        spritesToNotBeObscured: [this.#player.sprite, data.npc.sprite],
        type: TRANSITION_TYPES.LEFT_RIGHT_DOWN_SLOW
      })
    ]

    Promise.all(promises).then(responses => {
      data.onTransitionComplete()
      this.#startBattleScene(responses[0])
    })
  }

  /**
   * 
   * @param {import('../types/typedef.js').BattleSceneConfig} config 
   */
  #startBattleScene (config) {
    this.#isTransitioning = false
    this.scene.start(SCENE_KEYS.BATTLE_SCENE, config)
  }

  /**
   * 
   * @param {import('../types/direction.js').Direction} direction 
   * @returns {boolean}
   */
  #playerCanMove (direction) {
    return direction !== DIRECTION.NONE && !this.#isPlayerInputLocked() && !this.#menu.isVisible
  }

  #toggleMenu () {
    this.#savePlayerPosition()
    if (this.#menu.isVisible) {
      this.#menu.hide()
      return
    }
    this.#menu.show()
  }

  /**
   * 
   * @param {object} keyPressed
   * @param {boolean} keyPressed.wasSpaceKeyPresed 
   * @param {import('../types/direction.js').Direction} keyPressed.selectedDirectionPressedOnce 
   * @param {boolean} keyPressed.wasBackKeyPressed 
   * @returns {void}
   */
  #handleItemMenuInteraction (keyPressed) {
    const {
      wasSpaceKeyPresed,
      selectedDirectionPressedOnce,
      wasBackKeyPressed
    } = keyPressed

    if (wasBackKeyPressed) {
      this.#itemMenu.hide()
      return
    }

    if (wasSpaceKeyPresed) {
      this.#itemMenu.handlePlayerInput('OK')
      if (this.#itemMenu.selectedItemOption) {
        this.#handleItemSelected(this.#itemMenu.selectedItemOption)
        return
      }
      return
    }
    this.#itemMenu.handlePlayerInput(selectedDirectionPressedOnce)
    return
  }
  
  /**
   * 
   * @param {object} keyPressed
   * @param {boolean} keyPressed.wasSpaceKeyPresed 
   * @param {import('../types/direction.js').Direction} keyPressed.selectedDirectionPressedOnce 
   * @param {boolean} keyPressed.wasBackKeyPressed 
   * @returns {void}
   */
  #handlePartyMenuInteraction (keyPressed) {
    const {
      wasSpaceKeyPresed,
      selectedDirectionPressedOnce,
      wasBackKeyPressed
    } = keyPressed

    if (wasBackKeyPressed) {
      this.#partyMenu.handlePlayerInput('CANCEL')
      if (this.#onPartyMonSelection) {
        this.#partyMenu.hide()
        this.#onPartyMonSelection = undefined
        this.#partyMenu.selectOnlyMode = false
        this.#dialogUi.hideDialogModal()
      }
      return
    }

    if (wasSpaceKeyPresed) {
      this.#partyMenu.handlePlayerInput('OK')
      if (this.#onPartyMonSelection && this.#partyMenu.selectedMon) {
        this.#onPartyMonSelection()
        return
      }
      return
    }
    this.#partyMenu.handlePlayerInput(selectedDirectionPressedOnce)
    return
  }

  /**
   * 
   * @param {object} keyPressed
   * @param {boolean} keyPressed.wasSpaceKeyPresed 
   * @param {import('../types/direction.js').Direction} keyPressed.selectedDirectionPressedOnce 
   * @param {boolean} keyPressed.wasBackKeyPressed 
   * @returns {void}
   */
  #handleMenuInteraction (keyPressed) {
    const {
      wasSpaceKeyPresed,
      selectedDirectionPressedOnce,
      wasBackKeyPressed
    } = keyPressed

    if (selectedDirectionPressedOnce === DIRECTION.NONE && !wasBackKeyPressed && !wasSpaceKeyPresed) {
      return
    }

    if (this.#itemMenu.isVisible) {
      this.#handleItemMenuInteraction(keyPressed)
      return
    }

    if (this.#partyMenu.isVisible) {
      this.#handlePartyMenuInteraction(keyPressed)
      return
    }

    if (this.#menu.isVisible) {
      if (wasBackKeyPressed) {
        this.#menu.hide()
        return
      }

      if (wasSpaceKeyPresed) { 
        this.#menu.handlePlayerInput('OK')
        const selected = this.#menu.selectedMenuOption

        switch (selected) {
          case MENU_OPTIONS.SAVE:
            this.#saveGame()
            this.#menu.hide()
            break
          case MENU_OPTIONS.ITEM:
            this.#itemMenu.show()
            break
          case MENU_OPTIONS.POKEMON:
            this.#partyMenu.show()
            break
          case MENU_OPTIONS.EXIT:
            this.#menu.hide()
            break  
          case MENU_OPTIONS.POKEDEX:
          case MENU_OPTIONS.OPTIONS:
            break
          default:
            exhaustiveGuard(selected)
            break
        }
      }
  
      this.#menu.handlePlayerInput(selectedDirectionPressedOnce)
      return
    }
  }

  #saveGame () {
    dataManager.saveGame()
    this.#audioManager.playSfx(SFX_ASSET_KEYS.SAVE)
    this.#dialogUi.showDialogModalAndWaitForInput(['Game saved!'])
  }

  /**
   * 
   * @param {import('../types/typedef.js').Item} item 
   */
  #handleItemSelected (item) {
    switch (item.typeKey) {
      case ITEM_TYPE_KEY.HEALING:
        this.#itemMenu.hide()
        this.#partyMenu.selectOnlyMode = true
        this.#partyMenu.show()
        this.#onPartyMonSelection = () => {
          playItemEffect(this, {
            mon: this.#partyMenu.selectedMon,
            item,
            callback: (result) => {
              const { msg } = result
              this.#dialogUi.showDialogModalAndWaitForInput([msg], () => {
                this.#partyMenu.selectOnlyMode = false
                this.#partyMenu.hide()
                this.#itemMenu.show()
                this.#onPartyMonSelection = undefined
              })
            }
          })
        }
        break
        default:
          this.#dialogUi.showDialogModalAndWaitForInput([`Nothing happened...`])
          break
    }
  }
}