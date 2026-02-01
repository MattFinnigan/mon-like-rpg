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
      <input  v-model="form.name" type="text" id="name" required/>
    </label>

    <label for="type">
      Type
      <input v-model="form.trainerType" type="text" id="name" required />
    </label>

    <label for="reward">
      Reward on Victory
      <input v-model="form.rewardOnVictory" type="number" id="reward" required  min="0"/>
    </label>

    <label for="pay">
      Payout on defeat
      <input v-model="form.payOutOnDefeat" type="number" id="pay" required  min="0"/>
    </label>

    <label for="msg">
      Defeated message
      <input v-model="form.defeatedMsg" type="text" id="msg" required />
    </label>

    <label for="type">
      Asset key
      <select v-model="form.assetKey" id="type">
        <option v-for="opt in assetOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>

    <label for="mons">
      Mons
      <ul class="form-list-items">
        <li v-for="(mon, i) in currentMons">
          <span>
            <strong>{{ mon.name }} {{ mon.currentLevel }}</strong>
          </span>
          <span @click="handleRemoveMon(mon.id)">remove</span>
        </li>
      </ul>

      <div v-if="form.partyMons.length < 6" class="section">
        <label for="newMon">
          Add Mon
          <select v-model="currentNewMon" id="newMon">
            <option v-for="opt in monOptions" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <button v-if="currentNewMon" class="btn sm" @click="handleAddNewMon">Add</button>
      </div>
    </label>
  </form>
</template>
<script>
import { TRAINER_SPRITES } from '../../../../src/assets/asset-keys'

/**
 * @typedef {import('../../../../src/types/typedef').Trainer} Trainer
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
   *  form: Trainer,
   *  mons: import('../../../../src/types/typedef').Mon[],
   *  currentNewMon: import('../../../../src/types/typedef').Mon
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm },
      mons: [],
      currentNewMon: null
    }
  },
  mounted () {
    console.log(this.initialForm)
    this.getMons()
  },
  computed: {
    assetOptions () {
      return Object.keys(TRAINER_SPRITES).map(key => {
        return { label: key, value: key }
      })
    },
    monOptions () {
      return this.mons.filter(mon => {
        return !this.form.partyMons.includes(mon.id)
      }).map(mon => {
        return { label: `${mon.name} Lv${mon.currentLevel} #${mon.id}`, value: mon.id }
      })
    },
    currentMons () {
      return this.mons.filter(mon => {
        return this.form.partyMons.includes(mon.id)
      })
    }
  },
  methods: {
    handleAddNewMon (e) {
      e.preventDefault()
      if (!this.currentNewMon) {
        return
      }

      if (this.form.partyMons.includes(this.currentNewMon)) {
        return
      }
      
      this.form.partyMons.push(this.currentNewMon)
      this.currentNewMon = null
    },
    handleRemoveMon (id) {
      const index = this.form.partyMons.indexOf(id)
      this.form.partyMons.splice(index, 1)
    },
    async getMons () {
      /** @type {import('../../../../src/types/typedef').Mon[]} */
      const res = await $fetch('/api/mon/list')
      this.mons = res
    },
    async handleSave () {
      if (!this.form.partyMons.length) {
        alert('please add at least 1 mon')
        return
      }

      if (this.initialForm.id) {
        try {
          const response = await $fetch(`/api/trainer/${this.initialForm.id}`, {
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
        const response = await $fetch(`/api/trainer/new`, {
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