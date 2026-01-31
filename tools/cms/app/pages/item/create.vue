const item = 

<template>
  <ViewComponent
    :editing="true"
    @cancel="handleCancel">
    <template #heading>
      New Item
    </template>
    <template #content>
      <ItemForm v-if="form" :item="item" />
    </template>
  </ViewComponent>
</template>

<script>
export default {
  /**
   * @returns {{
   *  item: import('../../../../../src/types/typedef').Item | null
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
      this.form = await $fetch('/api/item/new')
    },
    handleCancel () {
      this.$router.push('/item/list')
    }
  }
}
</script>