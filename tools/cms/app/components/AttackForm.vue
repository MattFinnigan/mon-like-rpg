<template>
  <form
    v-if="form"
    class="form-container"
    id="form"
    @submit.prevent="handleSave">
    <DisplayField
      v-if="initialForm.id"
      label="ID"
      :value="initialForm.id" />

    <label for="name">
      Name
      <input v-model="form.name" type="text" id="name" required />
    </label>

    <label>
      Animation Name/Key
      <input  v-model="form.animationName" type="text" id="animationName" required/>
    </label>

    <label for="type">
      Type
      <select v-model="form.typeKey" id="type">
        <option v-for="opt in typeOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>

    <label for="power">
      Power
      <input v-model="form.power" type="number" id="power" required  min="0" max="100"/>
    </label>

    <label for="criticalHitModifier">
      Crit Modifer
      <input v-model="form.criticalHitModifier" type="number" id="criticalHitModifier" required  min="0" max="10"/>
    </label>

    <label for="usesSpec">
      Uses Special 
      <input v-model="form.usesMonSplStat" type="checkbox" id="usesSpec" />
    </label>

    <label for="powerPoints">
      PP
      <input v-model="form.powerPoints" type="number" id="powerPoints" required  min="1" />
    </label>

    <label for="accuracy">
      Accuracy (%)
      <input v-model="form.accuracy" type="number" id="accuracy" required  min="1"  max="100"/>
    </label>

    <label for="turnsToCharge">
      Charging Turns
      <input v-model="form.turnsToCharge" type="number" id="turnsToCharge" />
    </label>

    <label for="chargingMessage">
      Charging Message
      <input v-model="form.chargingMessage" type="text" id="chargingMessage" />
    </label>

    <label for="turnsOnCooldown">
      Cooldown Turns
      <input v-model="form.turnsOnCooldown" type="number" id="turnsOnCooldown" />
    </label>

    <label for="coolDownMessage">
      Cooldown Message
      <input v-model="form.coolDownMessage" type="text" id="coolDownMessage" />
    </label>

    <label for="turnsInEffect">
      In-effect turns
      <input v-model="form.turnsInEffect" type="number" id="turnsInEffect" />
    </label>
  
    <label for="statusEffect">
      Status Effect
    
      <div v-if="form.statusEffect" class="section">
        <label for="statusEffect">
          Effect
          <select v-model="form.statusEffect.name" id="statusEffectName">
            <option v-for="opt in statusEffectOptions" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <label for="statusEffectPerc">
          Chance to apply (%)
          <input v-model="form.statusEffect.chancePercentage" type="number" id="statusEffectPerc" required  min="0" max="100"/>
          <button class="btn sm" @click="form.statusEffect = null">Remove</button>
        </label>
      </div>

      <button v-if="!form.statusEffect" class="btn sm" @click="form.statusEffect = { name: 'FREEZE', chancePercentage: 0 }">Add</button>
    </label>

    <label for="selfBattleStatEffects">
      Battle Stat Effects (Self)
      <ul class="form-list-items">
      <li v-for="stat in form.selfBattleStatEffects">
        <span>
          <span><strong>Stat:</strong> {{ stat.statKey }}</span> &nbsp;
          <span><strong>Amount:</strong> {{ stat.amount }}</span> &nbsp;
          <span><strong>Chance:</strong> {{ stat.chancePercentage }}%</span> &nbsp;
        </span>
        <span @click="handleRemoveSelfBattleStatEffect(i)">remove</span>
      </li>
    </ul>
      <button v-if="!newSelfBattleStatEffect" class="btn sm" @click="newSelfBattleStatEffect = { statKey: 'ATTACK', chancePercentage: 0, amount: 0 }">Add</button>
    </label>

    <div v-if="newSelfBattleStatEffect" class="section">
      <label for="statName">
        Stat Name
        <select v-model="newSelfBattleStatEffect.statKey" id="statName">
          <option v-for="opt in statOptions" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>

      <label for="statChance">
        Chance to apply (%)
        <input v-model="newSelfBattleStatEffect.chancePercentage" type="number" id="statChance" required  min="0" max="100"/>
      </label>

      <label for="statAmount">
        Amount
        <input v-model="newSelfBattleStatEffect.amount" type="number" id="amount" required/>
      </label>
      <button class="btn sm" @click="handleAddSelfBattleStateEffect">Add</button>
      <button class="btn sm" @click="newSelfBattleStatEffect = null">Cancel</button>
    </div>

    <label for="oppBattleStatEffects">
      Battle Stat Effects (Opponent)
      <ul class="form-list-items">
        <li v-for="stat in form.opponentBattleStatEffects">
          <span>
            <span><strong>Stat:</strong> {{ stat.statKey }}</span> &nbsp;
            <span><strong>Amount:</strong> {{ stat.amount }}</span> &nbsp;
            <span><strong>Chance:</strong> {{ stat.chancePercentage }}%</span> &nbsp;
          </span>
          <span @click="handleRemoveOppBattleStatEffect">remove</span>
        </li>
      </ul>
      <button v-if="!newOppBattleStatEffect" class="btn sm" @click="newOppBattleStatEffect = { statKey: 'ATTACK', chancePercentage: 0, amount: 0 }">Add</button>
    </label>

    <div v-if="newOppBattleStatEffect" class="section">
      <label for="statName">
        Stat Name
        <select v-model="newOppBattleStatEffect.statKey" id="statName">
          <option v-for="opt in statOptions" :value="opt.value">{{ opt.label }}</option>
        </select>
      </label>

      <label for="statChance">
        Chance to apply (%)
        <input v-model="newOppBattleStatEffect.chancePercentage" type="number" id="statChance" required  min="0" max="100"/>
      </label>

      <label for="statAmount">
        Amount
        <input v-model="newOppBattleStatEffect.amount" type="number" id="amount" required/>
      </label>
      <button class="btn sm" @click="handleAddOppBattleStateEffect">Add</button>
      <button class="btn sm" @click="newOppBattleStatEffect = null">Cancel</button>
    </div>
  </form>
</template>
<script>
import { MON_TYPES } from '../../../../src/types/mon-types'
import { STATUS_EFFECT } from '../../../../src/types/status-effect';
import { MON_BATTLE_STAT } from '../../../../src/types/mon-battle-stats';
console.log(MON_TYPES)
/**
 * @typedef {import('../../../../src/types/typedef').Attack} Attack
 */

export default {
  emits: ['submitted'],
  props: {
    initialForm: {
      type: Object
    },
    existing: Boolean
  },
  /**
   * @returns {{
   *  form: Attack
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm },
      newSelfBattleStatEffect: null,
      newOppBattleStatEffect: null
    }
  },
  mounted () {
    console.log(this.initialForm)
  },
  computed: {
    typeOptions () {
      return Object.keys(MON_TYPES).map(type => {
        return { label: type, value: type }
      })
    },
    statusEffectOptions () {
      return Object.keys(STATUS_EFFECT).map(key => {
        return { label: key, value: key }
      })
    },
    statOptions () {
      return Object.keys(MON_BATTLE_STAT).map(key => {
        return { label: key, value: key }
      })
    }
  },
  methods: {
    handleAddSelfBattleStateEffect (e) {
      e.preventDefault()
      if (!this.newSelfBattleStatEffect.statKey) {
        return
      }
      if (!this.newSelfBattleStatEffect.chancePercentage) {
        return
      }
      if (!this.newSelfBattleStatEffect.amount) {
        return
      }

      this.form.selfBattleStatEffects.push(this.newSelfBattleStatEffect)
      this.newSelfBattleStatEffect = null
    },
    handleAddOppBattleStateEffect (e) {
      e.preventDefault()
      if (!this.newOppBattleStatEffect.statKey) {
        return
      }
      if (!this.newOppBattleStatEffect.chancePercentage) {
        return
      }
      if (!this.newOppBattleStatEffect.amount) {
        return
      }

      this.form.opponentBattleStatEffects.push(this.newOppBattleStatEffect)
      this.newOppBattleStatEffect = null
    },
    handleRemoveSelfBattleStatEffect (index) {
      this.form.selfBattleStatEffects.splice(index, 1)
    },
    handleRemoveOppBattleStatEffect (index) {
      this.form.opponentBattleStatEffects.splice(index, 1)
    },
    async handleSave () {
      console.log(this.form)
      if (this.initialForm.id) {
        try {
          const response = await $fetch(`/api/attack/${this.initialForm.id}`, {
            method: 'PATCH',
            body: this.form
          })
          console.log('Updated:', response)
          this.$emit('submitted')
        } catch (error) {
          console.error('Error:', error)
        }
        return
      }

      try {
        const response = await $fetch(`/api/attack/new`, {
          method: 'POST',
          body: this.form
        })
        console.log('Created:', response)
        this.$emit('submitted')
      } catch (error) {
        console.error('Error:', error)
      }

    }
  }
}
</script>