<template>
  <form
    v-if="form"
    class="form-container"
    id="form"
    @submit.prevent="handleSave">
    <label for="name">
      Name
      <input v-model="form.player.name" type="text" id="name" required/>
    </label>

    <label for="items">
      <div class="top-row">
        <span>Items</span>
        <button v-if="!newItem" class="btn sm" @click="createNewItem">Add</button>
      </div>
      
      <div v-if="newItem" class="section">
        <label for="itemKey">
          Item
          <select v-model="newItem.itemKey" id="item">
            <option v-for="opt in itemOptions" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>

        <label for="qty">
          Qty
          <input v-model="newItem.qty" type="number" id="qty" required/>
        </label>
        <div>
          <button class="btn sm" @click="handleAddNewItem">Add</button>
          <button class="btn sm" @click="newItem = null">Cancel</button>
        </div>
      </div>

      <ul v-show="!newItem" class="form-list-items">
        <li v-for="(item, i) in form.player.inventory">
          <span>
            <strong>{{ item.itemKey }} x{{ item.qty }}</strong>
          </span>
          <span>
            <span @click="handleRemoveItem(i)">remove</span>
          </span>
        </li>
      </ul>
    </label>

    <label v-show="!editingMonIndex" for="mons">
      Mons
      <ul class="form-list-items">
        <li v-for="(mon, i) in form.player.partyMons">
          <span>
            <strong>{{ mon.name }} Lv{{ mon.currentLevel }}</strong>
          </span>
          <span>
          <span @click="editingMonIndex = i">edit</span> &nbsp;
          <span @click="handleRemoveMon(i)">remove</span>
          </span>
        </li>
      </ul>

      <div v-if="form.player.partyMons.length < 6" class="section">
        <label for="newMon">
          Add Mon
          <select v-model="currentNewMon" id="newMon">
            <option v-for="opt in monOptions" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <button v-if="currentNewMon" class="btn sm" @click="handleAddNewMon">Add</button>
      </div>
    </label>
    <div v-if="editingMonIndex !== null" class="section">
      <div class="top-row">
        <h4>Editing "{{ form.player.partyMons[editingMonIndex].name }}"</h4>
      </div>
      <MonForm
        :initial-form="{ ...form.player.partyMons[editingMonIndex], id: 0 }"
        :dont-save="true"
        @submitted="handleMonEdited">
        <template #btns>
          <div class="mb">
            <button class="btn sm" type="submit">Save</button>
            <button class="btn sm" @click="editingMonIndex = null">Cancel</button>
          </div>
        </template>
      </MonForm>

    </div>
  </form>
</template>
<script>
import { TRAINER_SPRITES } from '../../../../src/assets/asset-keys'

/**
 * @typedef {import('../../../../src/types/typedef').GlobalState} State
 */

export default {
  emits: ['submitted'],
  props: {
    initialForm: {
      type: Object
    },
    existing: Boolean,
    dev: Boolean
  },
  /**
   * @returns {{
   *  form: State,
   *  mons: import('../../../../src/types/typedef').Mon[],
   *  currentNewMon: import('../../../../src/types/typedef').Mon,
   *  editingMonIndex: number|null,
   *  newItem: import('../../../../src/types/typedef').InventoryItem|null,
   *  newItem: import('../../../../src/types/typedef').Item[],
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm },
      mons: [],
      currentNewMon: null,
      editingMonIndex: null,
      newItem: null,
      items: []
    }
  },
  mounted () {
    console.log(this.initialForm)
    this.getMons()
    this.getItems()
  },
  computed: {
    assetOptions () {
      return Object.keys(TRAINER_SPRITES).map(key => {
        return { label: key, value: key }
      })
    },
    monOptions () {
      return this.mons.map(mon => {
        return { label: `${mon.name} Lv${mon.currentLevel} #${mon.id}`, value: mon.id }
      })
    },
    itemOptions () {
      return this.items.map(item => {
        return { label: `${item.name}`, value: item.key }
      }).filter(item => {
        return !this.form.player.inventory.filter(inv => inv.itemKey === item.value).length
      })
    }
  },
  methods: {
    createNewItem (e) {
      e.preventDefault()
      this.newItem = { itemKey: '', qty: 1 }
    },
    handleAddNewItem (e) {
      e.preventDefault()
      if (!this.newItem.qty || !this.newItem.itemKey) {
        return
      }

      this.form.player.inventory.push(this.newItem)
      this.newItem = null
    },
    handleMonEdited (mon) {
      this.form.player.partyMons[this.editingMonIndex] = { ...mon, id: this.form.player.partyMons[this.editingMonIndex].id}
      this.editingMonIndex = null
    },
    handleAddNewMon (e) {
      e.preventDefault()
      if (!this.currentNewMon) {
        return
      }
      const mon = JSON.parse(JSON.stringify(this.mons.find(mon => mon.id === this.currentNewMon)))
      mon.id = Date.now() + Math.floor(Math.random() * 1000)
      this.form.player.partyMons.push(mon)
      console.log(mon.id)
      this.currentNewMon = null
    },
    handleRemoveMon (i) {
      this.form.player.partyMons.splice(i, 1)
    },
    handleRemoveItem (i) {
      this.form.player.inventory.splice(i, 1)
    },
    async getMons () {
      /** @type {import('../../../../src/types/typedef').Mon[]} */
      const res = await $fetch('/api/mon/list')
      this.mons = res
    },
    async getItems () {
      /** @type {import('../../../../src/types/typedef').Item[]} */
      const res = await $fetch('/api/item/list')
      this.items = res
    },
    async handleSave () {
      if (!this.form.player.partyMons.length) {
        alert('please add at least 1 mon')
        return
      }
      try {
        const response = await $fetch(`/api/save-${this.dev ? 'dev-' : ''}data/patch`, {
          method: 'PATCH',
          body: this.form
        })
        console.log('Updated:', response)
        this.$emit('submitted')
      } catch (error) {
        console.error('Error:', error)
      }

    }
  }
}
</script>
<style scoped>
.mb {
  margin-bottom: 1.5em;
}
</style>