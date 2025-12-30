import { SKIP_BATTLE_ANIMATIONS, TILE_SIZE, TILED_COLLISION_ALPHA } from '../../config.js';
import { WORLD_ASSET_KEYS } from '../assets/asset-keys.js';
import { DIRECTION } from '../common/direction.js';
import Phaser from '../lib/phaser.js'
import { Controls } from '../utils/controls.js';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager.js';
import { getTargetPositionFromGameObjectPositionAndDirection } from '../utils/grid-utils.js';
import { createBattleSceneTransition, createWildEncounterSceneTransition } from '../utils/scene-transition.js';
import { CANNOT_READ_SIGN_TEXT, PLACEHOLDER_TEXT } from '../utils/text-utils.js';
import { Player } from '../world/characters/player.js';
import { DialogUi } from '../world/dialog-ui.js';
import { SCENE_KEYS } from "./scene-keys.js";

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

    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
      collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate()
      }
    })
  
    this.cameras.main.startFollow(this.#player.sprite)
    this.cameras.main.fadeIn(500, 255, 255, 255)
    this.#worldForegroundImage = this.add.image(0, 0, WORLD_ASSET_KEYS.WORLD_FOREGROUND, 0).setOrigin(0)

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

    console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player is in an encounter zone`)
    this.#wildMonEncountered = Math.random() < 0.9
    if (this.#wildMonEncountered) {
      console.log(`[${WorldScene.name}:handlePlayerMovementUpdate] player encounted a wild mon`)

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
}