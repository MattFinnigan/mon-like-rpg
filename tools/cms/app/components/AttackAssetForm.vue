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
  
    <label for="key">
      Attack Key
      <select v-model="form.attackKey" id="type">
        <option v-for="opt in attackOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>

    <label v-if="!uploadNew" for="assetKey">
      Asset Key
      <select v-model="form.assetKey" id="assetKey">
        <option v-for="opt in assetOptions" :value="opt.value">{{ opt.label }}</option>
      </select>
      <button class="btn" @click="uploadNew = true">Upload new</button>
    </label>

    <div v-if="uploadNew" class="upload-new">
      <label for="assetKey">
        Asset key
        <input v-model="form.assetKey" type="text" name="assetKey" required />
      </label>
      <input type="file" accept="image/*" @change="onFile" />
      <button v-if="!uploaded && newAsset" type="button" class="btn" @click="onUpload">Upload asset</button>
      <button class="btn" @click="handleNewCancel">Cancel/Remove</button>
    </div>

    <label for="frameWidth">
      Frame Width (px)
      <input v-model="form.frameWidth" type="number" id="frameWidth" required  min="0"/>
    </label>

    <label for="frameHeight">
      Frame Height (px)
      <input v-model="form.frameHeight" type="number" id="frameHeight" required  min="0"/>
    </label>
  </form>
</template>
<script>
import { ATTACK_ASSET_KEYS } from '../../../../src/generated/attack-asset-keys';
import { ATTACK_KEYS } from '../../../../src/generated/attack-keys'

/**
 * @typedef {import('../../../../src/types/typedef').AttackAsset} AttackAsset
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
   *  form: AttackAsset,
   *  uploadNew: boolean,
   *  newAsset: object,
   *  uploaded: boolean
   * }}
   */
  data () {
    return {
      form: { ...this.initialForm },
      uploadNew: false,
      newAsset: null,
      uploaded: false
    }
  },
  computed: {
    attackOptions () {
      return Object.keys(ATTACK_KEYS).map(key => {
        return { label: key, value: key }
      })
    },
    assetOptions () {
      return Object.keys(ATTACK_ASSET_KEYS).map(key => {
        return { label: key, value: key }
      })
    }
  },
  methods: {
    async onUpload () {
      if (!this.newAsset) {
        return
      }

      if (!this.form.assetKey) {
        return
      }

      if (this.assetOptions.find(asset => asset.label === this.form.assetKey)) {
        alert('Asset name ' + this.form.assetKey + ' already exists')
        return
      }

      const form = new FormData()
      form.append('file', this.newAsset)
      form.append('name', this.form.assetKey + '.png')
  
      try {
        const resp = await $fetch('/api/attack-asset/upload', {
          method: 'POST',
          body: form
        })
        this.uploaded = true
      } catch (e) {
        console.error('Error:', e)
      }
    },
    onFile (e) {
      this.uploaded = false
      this.newAsset = e.target.files[0]
    },
    handleNewCancel () {
      this.form.assetKey = this.attackOptions[0].value
      this.uploadNew = false
      this.newAsset = null
      this.uploaded = false
    },
    async handleSave () {
      if (this.uploadNew) {
        if (!this.newAsset || !this.uploaded) {
          return
        }
      }

      if (this.initialForm.id) {
        try {
          const response = await $fetch(`/api/attack-asset/${this.initialForm.id}`, {
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
        const response = await $fetch(`/api/attack-asset/new`, {
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