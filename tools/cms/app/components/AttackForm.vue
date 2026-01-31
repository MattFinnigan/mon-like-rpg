<template>
  <form
    v-if="form"
    class="form-container"
    id="form"
    @submit.prevent="handleSave">
    <DisplayField
      v-if="initialForm.key"
      label="Key"
      :value="initialForm.key" />
    <label v-else for="key">
      Key
      <input  v-model="form.key" type="text" id="key" required/>
    </label>

    <label for="name">
      Name
      <input v-model="form.name" type="text" id="name" required />
    </label>

    <label for="type">
      Type
      <select v-model="form.typeKey" id="type">
        <option v-for="opt in typeOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>

    <label for="value">
      Value
      <input v-model="form.value" type="number" id="value" required  min="0"/>
    </label>
  </form>
</template>
<script>
import { ITEM_TYPE_KEY } from '../../../../src/generated/item-type-keys'

/**
 * @typedef {import('../../../../src/types/typedef').Item} Item
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
   *  form: Item
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm }
    }
  },
  mounted () {
    console.log(this.initialForm)
  },
  computed: {
    typeOptions () {
      return Object.keys(ITEM_TYPE_KEY).map(key => {
        return { label: key, value: key }
      })
    }
  },
  methods: {
    async handleSave () {
      if (this.initialForm.key) {
        try {
          const response = await $fetch(`/api/item/${this.initialForm.key}`, {
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
        const response = await $fetch(`/api/item/new`, {
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