import { OPPONENT_TYPES } from "../types/opponent-types.js";
import Phaser from "../lib/phaser.js";

/**
 * @typedef BattleMonConfig
 * @type {Object}
 * @property {Phaser.Scene} scene
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
 * @property {number} partySpriteSheet
 * @property {number} partySpriteAssetKey
 */

/**
 * @typedef Mon
 * @type {Object}
 * @property {number|undefined} id
 * @property {string} name
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
 * @property {number} currentExp
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
 * @property {EncounterAreaConfig} encounterArea
 */

/**
 * @typedef Trainer
 * @type {Object}
 * @property {OPPONENT_TYPES} type
 * @property {Mon[]} partyMons
 * @property {string} name
 * @property {string} trainerType
 * @property {string} assetKey
 * @property {number} rewardOnVictory
 * @property {number} payOutOnDefeat
 * @property {string} defeatedMsg
 */

/**
 * @typedef PlayerData
 * @type {Object}
 * @property {string} name
 * @property {Mon[]} partyMons
 * @property {Inventory} inventory
 */

/**
 * @typedef Attack
 * @type {Object}
 * @property {number} id
 * @property {string} name
 * @property {import("../battle/attacks/attack-keys.js").AttackKeys} animationName
 * @property {string} typeKey
 * @property {number} power
 * @property {number} criticalHitModifier
 * @property {number} usesMonSplStat flag to uses attack mon's special attack, defener's special defense
 * @property {array} selfStatusEffects
 * @property {array} opponentStatusEffects
 * @property {number} powerPoints
 * @property {number} accuracy
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
 * @property {number} colour
 * @property {string[]} immuneTo
 * @property {string[]} superEffectiveAgainst
 * @property {string[]} resistantAgainst
 */

/**
 * @typedef MonStats
 * @type {object}
 * @property {number} attack
 * @property {number} defense
 * @property {number} splAttack
 * @property {number} splDefense
 * @property {number} speed
 * @property {number} hp
 */

/**
 * @typedef PostAttackResult
 * @type {object}
 * @property {number} damageTaken
 * @property {boolean} wasCriticalHit
 * @property {boolean} wasSuperEffective
 * @property {boolean} wasResistant
 * @property {boolean} wasImmune
 */

/**
 * @typedef BattleSceneConfig
 * @type {object}
 * @property {OPPONENT_TYPES} type
 * @property {import('../types/typedef.js').Trainer} [trainer]
 * @property {{
 *  mon: import("../types/typedef.js").Mon,
 *  baseMon: import("../types/typedef.js").BaseMon
 * }} [generatedMon]
 */

/**
 * @typedef ItemType
 * @type {object}
 * @property {import("../scenes/scene-keys.js").SceneKey[]} usableDuringScenes
 */
/**
 * @typedef Item
 * @type {object}
 * @property {ItemType} type
 * @property {import("./items.js").ItemTypeKey} typeKey
 * @property {import("./items.js").ItemKey} key
 * @property {string} name
 * @property {any} [value]
 */

/**
 * @typedef InventoryItem
 * @type {object}
 * @property {import("./items.js").ItemKey} itemKey
 * @property {number} qty
 */

/**
 * @typedef Inventory
 * @type {InventoryItem[]}
 */