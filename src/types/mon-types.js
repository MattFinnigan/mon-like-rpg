export const MON_TYPES = (() => {
/** @type {Record<string, import('./typedef').Type>} */
const TYPES = {
  NORMAL: {
    name: 'NORMAL',
    colour: 0xA8A77A,
    immuneTo: [],
    superEffectiveAgainst: [],
    resistantAgainst: []
  },
  FIRE: {
    name: 'FIRE',
    colour: 0xEE8130,
    immuneTo: [],
    superEffectiveAgainst: ['GRASS', 'ICE', 'BUG', 'STEEL'],
    resistantAgainst: ['FIRE', 'GRASS', 'ICE', 'BUG', 'STEEL', 'FAIRY']
  },
  WATER: {
    name: 'WATER',
    colour: 0x6390F0,
    immuneTo: [],
    superEffectiveAgainst: ['FIRE', 'GROUND', 'ROCK'],
    resistantAgainst: ['FIRE', 'WATER', 'ICE', 'STEEL']
  },

  ELECTRIC: {
    name: 'ELECTRIC',
    colour: 0xF7D02C,
    immuneTo: ['GROUND'],
    superEffectiveAgainst: ['WATER', 'FLYING'],
    resistantAgainst: ['ELECTRIC', 'FLYING', 'STEEL']
  },

  GRASS: {
    name: 'GRASS',
    colour: 0x7AC74C,
    immuneTo: [],
    superEffectiveAgainst: ['WATER', 'GROUND', 'ROCK'],
    resistantAgainst: ['WATER', 'ELECTRIC', 'GRASS', 'GROUND']
  },

  ICE: {
    name: 'ICE',
    colour: 0x96D9D6,
    immuneTo: [],
    superEffectiveAgainst: ['GRASS', 'GROUND', 'FLYING', 'DRAGON'],
    resistantAgainst: ['ICE']
  },

  FIGHTING: {
    name: 'FIGHTING',
    colour: 0xC22E28,
    immuneTo: ['GHOST'],
    superEffectiveAgainst: ['NORMAL', 'ICE', 'ROCK', 'DARK', 'STEEL'],
    resistantAgainst: ['BUG', 'ROCK', 'DARK']
  },

  POISON: {
    name: 'POISON',
    colour: 0xA33EA1,
    immuneTo: ['STEEL'],
    superEffectiveAgainst: ['GRASS', 'FAIRY'],
    resistantAgainst: ['GRASS', 'FIGHTING', 'POISON', 'BUG', 'FAIRY']
  },

  GROUND: {
    name: 'GROUND',
    colour: 0xE2BF65,
    immuneTo: ['FLYING'],
    superEffectiveAgainst: ['FIRE', 'ELECTRIC', 'POISON', 'ROCK', 'STEEL'],
    resistantAgainst: ['POISON', 'ROCK']
  },

  FLYING: {
    name: 'FLYING',
    colour: 0xA98FF3,
    immuneTo: [],
    superEffectiveAgainst: ['GRASS', 'FIGHTING', 'BUG'],
    resistantAgainst: ['GRASS', 'FIGHTING', 'BUG']
  },

  PSYCHIC: {
    name: 'PSYCHIC',
    colour: 0xF95587,
    immuneTo: ['DARK'],
    superEffectiveAgainst: ['FIGHTING', 'POISON'],
    resistantAgainst: ['FIGHTING', 'PSYCHIC']
  },

  BUG: {
    name: 'BUG',
    colour: 0xA6B91A,
    immuneTo: [],
    superEffectiveAgainst: ['GRASS', 'PSYCHIC', 'DARK'],
    resistantAgainst: ['GRASS', 'FIGHTING', 'GROUND']
  },

  ROCK: {
    name: 'ROCK',
    colour: 0xB6A136,
    immuneTo: [],
    superEffectiveAgainst: ['FIRE', 'ICE', 'FLYING', 'BUG'],
    resistantAgainst: ['NORMAL', 'FIRE', 'POISON', 'FLYING']
  },

  GHOST: {
    name: 'GHOST',
    colour: 0x735797,
    immuneTo: ['NORMAL'],
    superEffectiveAgainst: ['PSYCHIC', 'GHOST'],
    resistantAgainst: ['POISON', 'BUG']
  },

  DRAGON: {
    name: 'DRAGON',
    colour: 0x6F35FC,
    immuneTo: ['FAIRY'],
    superEffectiveAgainst: ['DRAGON'],
    resistantAgainst: ['FIRE', 'WATER', 'ELECTRIC', 'GRASS']
  },

  DARK: {
    name: 'DARK',
    colour: 0x705746,
    immuneTo: [],
    superEffectiveAgainst: ['PSYCHIC', 'GHOST'],
    resistantAgainst: ['GHOST', 'DARK']
  },

  STEEL: {
    name: 'STEEL',
    colour: 0xB7B7CE,
    immuneTo: [],
    superEffectiveAgainst: ['ICE', 'ROCK', 'FAIRY'],
    resistantAgainst: [
      'NORMAL',
      'GRASS',
      'ICE',
      'FLYING',
      'PSYCHIC',
      'BUG',
      'ROCK',
      'DRAGON',
      'STEEL',
      'FAIRY'
    ]
  },

  FAIRY: {
    name: 'FAIRY',
    colour: 0xD685AD,
    immuneTo: [],
    superEffectiveAgainst: ['FIGHTING', 'DRAGON', 'DARK'],
    resistantAgainst: ['FIGHTING', 'BUG', 'DARK']
  }
}


  // guard against mistyping types...
  for (const key in TYPES) {
    for (const key2 of TYPES[key].immuneTo) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
    for (const key2 of TYPES[key].superEffectiveAgainst) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
    for (const key2 of TYPES[key].resistantAgainst) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
  }
  return Object.freeze(TYPES)
})()
