import { OPPONENT_TYPES } from "../common/opponent-types.js";
import Phaser from "../lib/phaser.js";

/**
 * @typedef BattleMonConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
 * @property {BaseMon} baseMonDetails
 * @property {Mon} monDetails
 * @property {boolean} [skipBattleAnimations=false]
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef BaseMon
 * @type {Object}
 * @property {number} baseMonIndex
 * @property {string} name
 * @property {string} assetKey
 * @property {number} [assetFrame=0]
 * @property {number} baseAttack
 * @property {number} baseDefense
 * @property {number} baseSplAttack
 * @property {number} baseSplDefense
 * @property {number} baseSpeed
 * @property {number} baseHp
 * @property {Type[]} types
 * @property {number[]} learnSet
 */

/**
 * @typedef Mon
 * @type {Object}
 * @property {number|undefined} [id]
 * @property {number} baseMonIndex
 * @property {number} currentHp
 * @property {number} currentLevel
 * @property {number} attackEV
 * @property {number} defenseEV
 * @property {number} splAttackEV
 * @property {number} splDefenseEV
 * @property {number} speedEV
 * @property {number} hpEV
 * @property {number[]} attackIds
 */

/**
 * @typedef EncounterAreaConfig
 * @type {Object}
 * @property {number} encounterRate
 * @property {EncounterMon[]} mons
 */

/**
 * @typedef EncounterMon
 * @type {Object}
 * @property {number} rate
 * @property {number} baseMonIndex
 * @property {number} minLevel
 * @property {number} maxLevel
 */

/**
 * @typedef WildMon
 * @type {Object}
 * @property {OPPONENT_TYPES} type
 * @property {EncounterAreaConfig} encounterArea
 */

/**
 * @typedef Trainer
 * @type {Object}
 * @property {OPPONENT_TYPES} type
 * @property {Mon[]} mons
 * @property {string} name
 * @property {string} trainerType
 * @property {string} assetKey
 * @property {number} rewardOnVictory
 * @property {number} payOutOnDefeat
 */

/**
 * @typedef Player
 * @type {Object}
 * @property {string} name
 * @property {Mon[]} partyMons
 */

/**
 * @typedef Attack
 * @type {Object}
 * @property {number} id
 * @property {string} name
 * @property {import("../battle/attacks/attack-keys.js").AttackKeys} animationName
 */

/**
 * @typedef Animation
 * @type {Object}
 * @property {string} key
 * @property {number[]} [frames]
 * @property {number} frameRate
 * @property {number} repeat
 * @property {number} delay
 * @property {boolean} yoyo
 * @property {string} assetKey
 */

/**
 * @typedef Type
 * @type {Object}
 * @property {string} name
 * @property {Type[]} weaknessTo
 * @property {Type[]} strongAgainst
 * @property {Type[]} ineffectiveAgainst
 */
