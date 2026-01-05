import Phaser from './lib/phaser.js'
import { SCENE_KEYS } from './scenes/scene-keys.js'
import { PreloadScene } from './scenes/preload-scene.js'
import { BattleScene } from './scenes/battle-scene.js'
import { WorldScene } from './scenes/world-scene.js'
import { PartyScene } from './scenes/party-scene.js'

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  pixelArt: true,
  scale: {
    parent: 'game-container',
    width: 640,
    height: 576,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#000000'
})

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene)
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene)
game.scene.add(SCENE_KEYS.WORLD_SCENE, WorldScene)
game.scene.add(SCENE_KEYS.PARTY_SCENE, PartyScene)
game.scene.start(SCENE_KEYS.PRELOAD_SCENE)
