BATTLE SYSTEM
- [x] Add Paralyzed, Poisoned, Burnt, Sleeping, Confused & Frozen status effects
- [] Add support for weather moves
- [] Add support for item use on party mons
- [] Add support for battle stat effecting items
- [] Add support for status removing item
- [] Remember opting not to learn level-up moves
- [] BUG: Avoid attempting to learn level-up move on EXP gain...
- [] BUG: On Evolve finish - text is incorrect
- [] Smart trainer NPCS (After more attack moves, more item use options are added)
  - [] Add base 'Battle NPC decision' class
  - [] Battle NPC decision classes hold decision trees, tatics & strats
  - [] Battle NPC decision child classes attached to NPCS - 'difficulty' weight passed through
  - [] Battle state then passes in current battle situation, conditions to this decision class and returns the next decision

WORLD
- [] Add support for key items
- [] Add support for world effecting items (Repel)
- [] Add support for mon stat altering, level alterating items
- [] Add TMs
- [] Add fishing
- [] Add surfing
- [] Add 'Spinner' NPCs
- [] Add 'Line of sight' battle NPCs
  - [] Track which NPCs have already been defeated
- [] Expand NPC movement pattern options
- [] Handle generated encounter mons that can learn > 4 moves (eg. at least 1 damaging move, prioritize moves learnt in later levels, etc)
- [] Add shopping
- [] Add healer

MULTIPLAYER
- [x] Battle scene to support variable enemy decision times
- [] Is Network Battle flags on Enemy decision related states - fetching attack, item decisions, etc.
- [] Plan method of communication - Websockets, Battle scene 'check in pings'?

DEVELOPMENT
- [] Improve workflow of adding attacks
  - [] Instant battle scene on refresh
  - [] Improve animation skipping - skip all but player 1/2's animations
  - [] Make giving the player/enemy mon the new move to test much easier
  - [] Add trainers specifically for attack testing
- [] Add more robost database (Changes to data manager may require players to remove/reset their local storage)

CONTENT
- [] Plan out Player's 'Path'
  - [] Balance encounters, trainers based on determined player path
- [] Add x3 attacking moves per type
- [] Add x3 of each stat-effecting move (3 attack decreasing, 3 defense increasing, etc)
- [] Add weather moves
- [] Add VIC gym
- [] Add QLD map

