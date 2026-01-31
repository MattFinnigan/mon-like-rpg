<template>
  <form
    v-if="form && baseMonOptions.length && attackOptions.length"
    class="form-container"
    id="form"
    @submit.prevent="handleSave">
    <DisplayField
      v-if="initialForm.id"
      label="ID"
      :value="initialForm.id"
    />
  
    <label for="key">
      Base Mon
      <select v-model="form.baseMonIndex" id="type">
        <option v-for="opt in baseMonOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>

    <label for="name">
      Name
      <input v-model="form.name" type="text" id="name" required />
    </label>

    <label for="currentHp">
      Current HP (leave blank for full)
      <input v-model="form.currentHp" type="number" id="currentHp"  min="0"/>
    </label>

    <label for="currentLevel">
      Current Level
      <input v-model="form.currentLevel" type="number" id="currentLevel"  min="1" required/>
    </label>

    <label for="currentExp">
      Current XP
      <input v-model="form.currentExp" type="number" id="currentExp"  min="0" required/>
    </label>

    <label for="attacks">
      Attacks
      <ul class="form-list-items">
        <li v-for="(attack, i) in currentAttacks">
          <span>
            <strong>{{ attack.name }}</strong>
          </span>
          <span @click="handleRemoveAttack(attack.id)">remove</span>
        </li>
      </ul>

      <div v-if="currentAttacks.length < 4" class="mini-form">
        <label for="newAttack">
          Add Attack
          <select v-model="currentNewAttack" id="newAttack">
            <option v-for="opt in attackOptions" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <button v-if="currentNewAttack" class="btn sm" @click="handleAddNewAttack">Add</button>
      </div>
    </label>


    <label for="currentExp">
      Attack
      <input v-model="form.attackEV" type="number" id="attack"  min="1" required/>
    </label>

    <label for="defenseEV">
      Defense
      <input v-model="form.defenseEV" type="number" id="defenseEV"  min="1" required/>
    </label>

    <label for="splAttackEV">
      Spl Attack
      <input v-model="form.splAttackEV" type="number" id="splAttackEV"  min="1" required/>
    </label>

    <label for="splDefense">
      Spl Defese
      <input v-model="form.splDefenseEV" type="number" id="splDefense"  min="1" required/>
    </label>

    <label for="speed">
      Speed
      <input v-model="form.speedEV" type="number" id="speed"  min="1" required/>
    </label>

    <label for="hpEv">
      Base HP
      <input v-model="form.hpEV" type="number" id="hpEv"  min="1" required/>
    </label>
  </form>
</template>
<script>

/**
 * @typedef {import('../../../../src/types/typedef').Mon} Mon
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
   *  form: Mon,
   *  baseMons: import('../../../../src/types/typedef').BaseMon[],
   *  attacks: import('../../../../src/types/typedef').Attack[]
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm },
      baseMons: [],
      attacks: [],
      currentNewAttack: null
    }
  },
  mounted () {
    console.log(this.initialForm)
    this.getBaseMons()
    this.getAttacks()
  },
  computed: {
    currentAttacks () {
      return this.attacks.filter(attk => {
        return this.form.attackIds.includes(attk.id)
      })
    },
    baseMonOptions () {
      return Object.keys(this.baseMons).map(key => {
        return { label: this.baseMons[key].name, value: key }
      })
    },
    attackOptions () {
      return this.attacks.map(attk => {
        return { label: attk.name, value: attk.id }
      }).filter(attk => {
        return !this.form.attackIds.includes(attk.value)
      })
    }
  },
  methods: {
    handleAddNewAttack (e) {
      e.preventDefault()
      if (!this.currentNewAttack) {
        return
      }

      if (this.form.attackIds.includes(this.currentAttacks)) {
        return
      }
      
      this.form.attackIds.push(this.currentNewAttack)
      this.currentNewAttack = null
    },
    handleRemoveAttack (id) {
      const index = this.form.attackIds.indexOf(id)
      this.form.attackIds.splice(index, 1)
    },
    async getBaseMons () {
      /** @type {import('../../../../src/types/typedef').BaseMon[]} */
      const res = await $fetch('/api/base-mon/list')
      this.baseMons = res
    },
    async getAttacks () {
      /** @type {import('../../../../src/types/typedef').Attack[]} */
      const res = await $fetch('/api/attack/list')
      this.attacks = res
    },
    async handleSave () {
      if (!this.form.attackIds.length) {
        alert('Please add at least 1 attack')
        return
      }
      if (this.initialForm.id) {
        try {
          const response = await $fetch(`/api/mon/${this.initialForm.id}`, {
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
        const response = await $fetch(`/api/mon/new`, {
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