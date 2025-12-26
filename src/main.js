import Phaser from './lib/phaser.js'
import { SCENE_KEYS } from './scenes/scene-keys.js'
import { PreloadScene } from './scenes/preload-scene.js'
import { BattleScene } from './scenes/battle-scene.js'

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  pixelArt: true,
  scale: {
    parent: 'game-container',
    width: 160,
    height: 144,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#fff'
})

game.scene.add(SCENE_KEYS.PRELOAD_SCENE, PreloadScene)
game.scene.add(SCENE_KEYS.BATTLE_SCENE, BattleScene)

game.scene.start(SCENE_KEYS.PRELOAD_SCENE)
