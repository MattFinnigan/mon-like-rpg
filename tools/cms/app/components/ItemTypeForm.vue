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
  
    <div
      v-for="sceneKey in sceneKeys"
      :key="sceneKey.label"
      :id="sceneKey.label">
      <label :for="sceneKey.label">
        <input
          type="checkbox"
          :id="sceneKey.label"
          :checked="sceneKey.value"
          @input="toggleScene(sceneKey.label)"
        />
        Enable use on {{ sceneKey.label }}
      </label>
    </div>

  </form>
</template>
<script>
import { SCENE_KEYS } from '../../../../src/scenes/scene-keys'

/**
 * @typedef {import('../../../../src/types/typedef').ItemType} ItemType
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
   *  form: ItemType
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm }
    }
  },
  computed: {
    sceneKeys () {
      return Object.keys(SCENE_KEYS).map(key => {
        return { label: key, value: this.form.usableDuringScenes.includes(key) }
      })
    }
  },
  methods: {
    toggleScene (scene) {
      const index = this.form.usableDuringScenes.indexOf(scene)
      if (index !== -1) {
        this.form.usableDuringScenes.splice(index, 1)
        return
      }
      this.form.usableDuringScenes.push(scene)
    },
    async handleSave () {
      if (this.initialForm.key) {
        try {
          const response = await $fetch(`/api/item-type/${this.initialForm.key}`, {
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
        const response = await $fetch(`/api/item-type/new`, {
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