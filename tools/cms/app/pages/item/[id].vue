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
      <div v-if="!editing && item" class="viewing-mode">
        <DisplayField label="Key" :value="item.key" />
        <DisplayField label="Name" :value="item.name" />
        <DisplayField label="Type" :value="item.typeKey" />
        <DisplayField label="Value" :value="item.value" />
      </div>
      <ItemForm
        v-if="editing"
        :initial-form="item"
        @submitted="onSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>

export default {
  /**
   * @returns {{
   *  item: import('../../../../../src/types/typedef').Item | null
   *  editing: boolean
   * }}
   */
  data () {
    return {
      item: null,
      editing: false
    }
  },
  mounted () {
    this.fetchItem()
  },
  computed: {
    heading () {
      if (this.editing) {
        return `Editing "${this.item?.name}"`
      }
      return `Viewing "${this.item?.name}"`
    }
  },
  methods: {
    async fetchItem () {
      const key = this.$route.params.id
      /** @type {import('../../../../../src/types/typedef').Item} */
      const res = await $fetch(`/api/item/${key}`)
      this.item = res
    },
    handleEdit () {
      this.editing = true
    },
    handleCopy () {
    },
    async handleDelete () {
      if (confirm('Are you sure you want to delete?')) {
        try {
          const response = await $fetch(`/api/item/${this.item.key}`, {
            method: 'DELETE'
          })
          console.log('Deleted:', response)
          this.$router.push('/item/list')
        } catch (error) {
          console.error('Error:', error)
        }
      }
    },
    handleCancel () {
      this.editing = false
    },
    async onSubmit () {
      await this.fetchItem()
      this.editing = false
    }
  }
}
</script>