<template>
  <ViewComponent
    :editing="editing"
    @cancel="handleCancel"
    @edit="handleEdit"
    @copy="handleCopy"
    @delete="handleDelete">
    <template #heading>
      {{ heading }}
    </template>
    <template #content>
      <div v-if="!editing && attkAsset" class="viewing-mode">
        <DisplayField label="ID" :value="attkAsset.id" />
        <DisplayField label="Attack key" :value="attkAsset.attackKey" />
        <DisplayField label="Asset key" :value="attkAsset.assetKey" />
        <DisplayField label="Frame width" :value="attkAsset.frameWidth" />
        <DisplayField label="Frame height" :value="attkAsset.frameHeight" />
      </div>
      <AttackAssetForm
        v-if="editing"
        :initial-form="attkAsset"
        @submitted="onSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>

export default {
  /**
   * @returns {{
   *  attkAsset: import('../../../../../src/types/typedef').AttackAsset | null
   *  editing: boolean
   * }}
   */
  data () {
    return {
      attkAsset: null,
      editing: false
    }
  },
  mounted () {
    this.fetchAttackAsset()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing Attack Asset "${this.attkAsset?.attackKey} ${this.attkAsset?.assetKey}"`
      }
      return `Viewing Attack Asset "${this.attkAsset?.attackKey} ${this.attkAsset?.assetKey}"`
    }
  },
  methods: {
    async fetchAttackAsset () {
      const key = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').AttackAsset} */
      const res = await $fetch(`/api/attack-asset/${key}`)
      this.attkAsset = res
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/attack-asset/${this.attkAsset.id}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/attack-asset/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    async handleCancel () {
      await this.fetchAttackAsset()
      this.editing = false
    },
    async onSubmit () {
      await this.fetchAttackAsset()
      this.editing = false
    }
  }
}
</script>