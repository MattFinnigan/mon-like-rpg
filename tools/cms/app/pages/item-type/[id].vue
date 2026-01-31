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
      <div v-if="!editing && itemType" class="viewing-mode">
        <DisplayField label="Key" :value="itemType.key" />
        <DisplayField label="Usable during scenes" :value="itemType.usableDuringScenes" />
      </div>
      <ItemTypeForm
        v-if="editing"
        :initial-form="itemType"
        @submitted="onSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>

export default {
  /**
   * @returns {{
   *  itemType: import('../../../../../src/types/typedef').ItemType | null
   *  editing: boolean
   * }}
   */
  data () {
    return {
      itemType: null,
      editing: false
    }
  },
  mounted () {
    this.fetchItem()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing Item Type "${this.itemType?.key}"`
      }
      return `Viewing Item Type "${this.itemType?.key}"`
    }
  },
  methods: {
    async fetchItem () {
      const key = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').ItemType} */
      const res = await $fetch(`/api/item-type/${key}`)
      this.itemType = res
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/item-type/${this.itemType.key}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/item-type/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    async handleCancel () {
      await this.fetchItem()
      this.editing = false
    },
    async onSubmit () {
      await this.fetchItem()
      this.editing = false
    }
  }
}
</script>