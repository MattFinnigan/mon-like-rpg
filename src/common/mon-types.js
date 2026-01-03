export const MON_TYPES = (() => {
  const TYPES = {
    NORMAL: {
      name: 'NORMAL',
      weaknessTo: ['FIGHTING'],
      ineffectiveAgainst: ['GHOST'],
      strongAgainst: []
    },
    
    FIRE: {
      name: 'FIRE',
      weaknessTo: ['WATER', 'GROUND', 'ROCK'],
      ineffectiveAgainst: [],
      strongAgainst: ['GRASS', 'ICE', 'BUG', 'STEEL']
    },
    
    WATER: {
      name: 'WATER',
      weaknessTo: ['ELECTRIC', 'GRASS'],
      ineffectiveAgainst: [],
      strongAgainst: ['FIRE', 'GROUND', 'ROCK']
    },
    
    ELECTRIC: {
      name: 'ELECTRIC',
      weaknessTo: ['GROUND'],
      ineffectiveAgainst: ['GROUND'],
      strongAgainst: ['WATER', 'FLYING']
    },
    
    GRASS: {
      name: 'GRASS',
      weaknessTo: ['FIRE', 'ICE', 'POISON', 'FLYING', 'BUG'],
      ineffectiveAgainst: [],
      strongAgainst: ['WATER', 'GROUND', 'ROCK']
    },
    
    ICE: {
      name: 'ICE',
      weaknessTo: ['FIRE', 'FIGHTING', 'ROCK', 'STEEL'],
      ineffectiveAgainst: [],
      strongAgainst: ['GRASS', 'GROUND', 'FLYING', 'DRAGON']
    },
    
    FIGHTING: {
      name: 'FIGHTING',
      weaknessTo: ['FLYING', 'PSYCHIC', 'FAIRY'],
      ineffectiveAgainst: ['GHOST'],
      strongAgainst: ['NORMAL', 'ICE', 'ROCK', 'DARK', 'STEEL']
    },
    
    POISON: {
      name: 'POISON',
      weaknessTo: ['GROUND', 'PSYCHIC'],
      ineffectiveAgainst: ['STEEL'],
      strongAgainst: ['GRASS', 'FAIRY']
    },
    
    GROUND: {
      name: 'GROUND',
      weaknessTo: ['WATER', 'GRASS', 'ICE'],
      ineffectiveAgainst: ['FLYING'],
      strongAgainst: ['FIRE', 'ELECTRIC', 'POISON', 'ROCK', 'STEEL']
    },
    
    FLYING: {
      name: 'FLYING',
      weaknessTo: ['ELECTRIC', 'ICE', 'ROCK'],
      ineffectiveAgainst: [],
      strongAgainst: ['GRASS', 'FIGHTING', 'BUG']
    },
    
    PSYCHIC: {
      name: 'PSYCHIC',
      weaknessTo: ['BUG', 'GHOST', 'DARK'],
      ineffectiveAgainst: ['DARK'],
      strongAgainst: ['FIGHTING', 'POISON']
    },
    
    BUG: {
      name: 'BUG',
      weaknessTo: ['FIRE', 'FLYING', 'ROCK'],
      ineffectiveAgainst: [],
      strongAgainst: ['GRASS', 'PSYCHIC', 'DARK']
    },
    
    ROCK: {
      name: 'ROCK',
      weaknessTo: ['WATER', 'GRASS', 'FIGHTING', 'GROUND', 'STEEL'],
      ineffectiveAgainst: [],
      strongAgainst: ['FIRE', 'ICE', 'FLYING', 'BUG']
    },
    
    GHOST: {
      name: 'GHOST',
      weaknessTo: ['GHOST', 'DARK'],
      ineffectiveAgainst: ['NORMAL'],
      strongAgainst: ['PSYCHIC', 'GHOST']
    },
    
    DRAGON: {
      name: 'DRAGON',
      weaknessTo: ['ICE', 'DRAGON', 'FAIRY'],
      ineffectiveAgainst: ['FAIRY'],
      strongAgainst: ['DRAGON']
    },
    
    DARK: {
      name: 'DARK',
      weaknessTo: ['FIGHTING', 'BUG', 'FAIRY'],
      ineffectiveAgainst: [],
      strongAgainst: ['PSYCHIC', 'GHOST']
    },
    
    STEEL: {
      name: 'STEEL',
      weaknessTo: ['FIRE', 'FIGHTING', 'GROUND'],
      ineffectiveAgainst: [],
      strongAgainst: ['ICE', 'ROCK', 'FAIRY']
    },
    
    FAIRY: {
      name: 'FAIRY',
      weaknessTo: ['POISON', 'STEEL'],
      ineffectiveAgainst: [],
      strongAgainst: ['FIGHTING', 'DRAGON', 'DARK']
    }
  }

  // guard against mistyping types...
  for (const key in TYPES) {
    for (const key2 of TYPES[key].weaknessTo) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
    for (const key2 of TYPES[key].ineffectiveAgainst) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
    for (const key2 of TYPES[key].strongAgainst) {
      if (!TYPES[key2]) {
        throw new Error(`Non existent type ${key2} was set in mon-types`)
      }
    }
  }
  return Object.freeze(TYPES)
})()
