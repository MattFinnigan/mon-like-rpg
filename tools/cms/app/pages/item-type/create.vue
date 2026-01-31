const item = 

<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Item Type
    </template>
    <template #content>
      <ItemTypeForm
        v-if="form"
        :initial-form="form"
        @submitted="handleSubmit"
      />
    </template>
  </ViewComponent>
</template>

<script>
export default {
  /**
   * @returns {{
   *  item: import('../../../../../src/types/typedef').ItemType | null
   * }}
   */
  data () {
    return {
      form: null
    }
  },
  mounted () {
    this.createNewItem()
  },
  computed: {
  },
  methods: {
    async createNewItem () {
      this.form = await $fetch('/api/item-type/new')
    },
    handleCancel () {
      this.$router.push('/item-type/list')
    },
    handleSubmit () {
      this.$router.push('/item-type/list')
    }
  }
}
</script>